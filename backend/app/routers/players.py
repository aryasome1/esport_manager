"""
Player Management Router
FIXED: Removed dependency on specific Enum attributes for division filtering.
Now uses string literals 'moba' and 'tactical' to match Database values directly.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Player, Hero, HeroStat, Team, User
# [NOTE] DivisionType import is kept for schema usage but not for filtering logic to avoid AttributeErrors
from ..models.division_models import DivisionType
from ..schemas.schemas import (
    PlayerCreate, PlayerUpdate, Player as PlayerSchema,
    PlayerWithHeroStats, HeroStatCreate, HeroStatUpdate, HeroStatResponse,
    PaginationParams, PaginatedResponse, BaseResponse, ErrorResponse
)

# Prefix sudah di-set di main.py (/api/players)
router = APIRouter(tags=["Players"])
logger = logging.getLogger(__name__)

def get_player_or_404(db: Session, player_id: int) -> Player:
    """Helper function to get player or raise 404"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found"
        )
    return player

@router.get("/", response_model=PaginatedResponse)
async def get_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    team_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    division: Optional[str] = Query(None, description="Filter by division: 'moba' or 'tactical'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all players with optional filtering and pagination.
    Includes signature_hero_image for UI display.
    """
    try:
        query = db.query(Player)
        
        # Apply filters
        if team_id:
            query = query.filter(Player.team_id == team_id)
        
        if role:
            query = query.filter(Player.current_role == role)
            
        # [FIXED LOGIC] Use string literals to match DB values directly
        if division:
            div_lower = division.lower()
            if div_lower == 'moba':
                # Filter 'moba'
                query = query.filter(Player.division_preference == 'moba')
            elif div_lower in ['tactical', 'valorant', 'fps']:
                # Filter 'tactical' (matches DB value from schema)
                query = query.filter(Player.division_preference == 'tactical')
        
        if search:
            search_filter = or_(
                Player.name.ilike(f"%{search}%"),
                Player.email.ilike(f"%{search}%"),
                Player.username.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        players = query.order_by(Player.ovr.desc()).offset(skip).limit(limit).all()
        
        # Attach Signature Hero Image Logic
        player_items = []
        for p in players:
            # Convert SQLAlchemy model to dict using Pydantic validation first
            try:
                p_data = PlayerSchema.model_validate(p)
                p_dict = p_data.model_dump()
            except Exception as e:
                # Fallback if validation fails, try manual dict creation
                p_dict = {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "ovr": p.ovr,
                    "division_preference": p.division_preference,
                    # Add minimum required fields
                }
            
            # Find best hero (highest power) for this player
            best_stat = db.query(HeroStat).filter(HeroStat.player_id == p.id)\
                .order_by(desc(HeroStat.hero_power)).first()
            
            signature_image = None
            signature_hero_name = None
            
            if best_stat:
                # Fetch hero details to get image
                hero = db.query(Hero).filter(Hero.id == best_stat.hero_id).first()
                if hero:
                    signature_image = hero.image_url
                    signature_hero_name = hero.name
            
            # Fallback image if no hero played yet or no image found
            if not signature_image:
                # Use UI Avatar generator as fallback
                signature_image = f"https://ui-avatars.com/api/?name={p.name}&background=random&color=fff&size=200"
            
            # Inject custom fields into the dictionary
            p_dict['signature_hero_image'] = signature_image
            p_dict['signature_hero_name'] = signature_hero_name
            
            player_items.append(p_dict)
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=player_items,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching players: {e}")
        # Print stack trace for easier debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch players: {str(e)}"
        )

@router.get("/{player_id}", response_model=PlayerWithHeroStats)
async def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get player details with hero stats
    """
    try:
        player = get_player_or_404(db, player_id)
        
        # Get player with relationships
        hero_stats = db.query(HeroStat).filter(HeroStat.player_id == player_id).all()
        
        # Manual construct response data dictionary to be safe
        response_data = {
            "id": player.id,
            "name": player.name,
            "email": player.email,
            "username": player.username,
            "ovr": player.ovr,
            "focus": player.focus,
            "mental": player.mental,
            "fatigue": player.fatigue,
            "current_role": player.current_role,
            "team_id": player.team_id,
            "experience_level": player.experience_level,
            "training_hours": player.training_hours,
            "division_preference": player.division_preference,
            # Stats specific
            "moba_laning_skill": player.moba_laning_skill,
            "moba_teamfight_presence": player.moba_teamfight_presence,
            "tactical_aim": player.tactical_aim,
            "tactical_gamesense": player.tactical_gamesense,
            "is_active": player.is_active,
            "created_at": player.created_at,
            "updated_at": player.updated_at,
            # Relations
            "hero_stats": hero_stats,
            "team": player.team
        }
        
        return PlayerWithHeroStats(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch player details"
        )

@router.post("/", response_model=PlayerSchema, status_code=status.HTTP_201_CREATED)
async def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new player
    """
    try:
        # Check if email already exists
        existing_player = db.query(Player).filter(Player.email == player_data.email).first()
        if existing_player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player with this email already exists"
            )
        
        # Create player
        db_player = Player(
            name=player_data.name,
            email=player_data.email,
            username=getattr(player_data, 'username', None),
            current_role=getattr(player_data, 'current_role', None),
            division_preference=getattr(player_data, 'division_preference', 'moba')
        )
        
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        
        logger.info(f"Player created: {player_data.name}")
        return db_player
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating player: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create player"
        )

@router.put("/{player_id}", response_model=PlayerSchema)
async def update_player(
    player_id: int,
    player_update: PlayerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update player details
    """
    try:
        player = get_player_or_404(db, player_id)
        update_data = player_update.dict(exclude_unset=True)
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(player, field):
                setattr(player, field, value)
        
        player.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(player)
        
        logger.info(f"Player updated: {player.name}")
        return player
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating player {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update player"
        )

@router.delete("/{player_id}", response_model=BaseResponse)
async def delete_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete player
    """
    try:
        player = get_player_or_404(db, player_id)
        
        # Check if player is part of a team
        if player.team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete player who is part of a team. Remove from team first."
            )
        
        db.delete(player)
        db.commit()
        
        logger.info(f"Player deleted: {player.name}")
        return BaseResponse(message="Player deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting player {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete player"
        )

@router.post("/{player_id}/hero-stats", response_model=HeroStatResponse)
async def create_hero_stat(
    player_id: int,
    hero_stat_data: HeroStatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create hero statistic for player
    """
    try:
        player = get_player_or_404(db, player_id)
        
        # Check if hero exists
        hero = db.query(Hero).filter(Hero.id == hero_stat_data.hero_id).first()
        if not hero:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hero not found"
            )
        
        # Check if stat already exists
        existing_stat = db.query(HeroStat).filter(
            and_(
                HeroStat.player_id == player_id,
                HeroStat.hero_id == hero_stat_data.hero_id
            )
        ).first()
        
        if existing_stat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hero stat already exists for this player"
            )
        
        # Create hero stat
        db_hero_stat = HeroStat(
            player_id=player_id,
            hero_id=hero_stat_data.hero_id,
            hero_power=hero_stat_data.hero_power
        )
        
        db.add(db_hero_stat)
        db.commit()
        db.refresh(db_hero_stat)
        
        logger.info(f"Hero stat created for player {player.name}, hero {hero.name}")
        return db_hero_stat
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating hero stat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create hero stat"
        )

@router.put("/hero-stats/{stat_id}", response_model=HeroStatResponse)
async def update_hero_stat(
    stat_id: int,
    stat_update: HeroStatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update hero statistic
    """
    try:
        hero_stat = db.query(HeroStat).filter(HeroStat.id == stat_id).first()
        if not hero_stat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hero stat not found"
            )
        
        update_data = stat_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(hero_stat, field):
                setattr(hero_stat, field, value)
        
        # Update timestamp
        if hasattr(hero_stat, 'last_played'):
            hero_stat.last_played = datetime.utcnow()

        db.commit()
        db.refresh(hero_stat)
        
        logger.info(f"Hero stat updated: {stat_id}")
        return hero_stat
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating hero stat {stat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update hero stat"
        )

@router.delete("/hero-stats/{stat_id}", response_model=BaseResponse)
async def delete_hero_stat(
    stat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete hero statistic
    """
    try:
        hero_stat = db.query(HeroStat).filter(HeroStat.id == stat_id).first()
        if not hero_stat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hero stat not found"
            )
        
        db.delete(hero_stat)
        db.commit()
        
        logger.info(f"Hero stat deleted: {stat_id}")
        return BaseResponse(message="Hero stat deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting hero stat {stat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete hero stat"
        )

@router.get("/{player_id}/analytics")
async def get_player_analytics(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get player analytics and statistics
    """
    try:
        player = get_player_or_404(db, player_id)
        
        # Get hero stats
        hero_stats = db.query(HeroStat).filter(HeroStat.player_id == player_id).all()
        
        # Calculate analytics
        total_matches_played = sum(stat.times_played for stat in hero_stats)
        avg_win_rate = sum(stat.win_rate for stat in hero_stats) / len(hero_stats) if hero_stats else 0
        
        # Find best hero
        best_hero_stat = max(hero_stats, key=lambda x: x.hero_power) if hero_stats else None
        
        # Get team info if player is in a team
        team = None
        if player.team_id:
            team = db.query(Team).filter(Team.id == player.team_id).first()
        
        analytics = {
            "player": player,
            "total_matches": total_matches_played,
            "avg_win_rate": round(avg_win_rate, 2),
            "best_hero": best_hero_stat.hero if best_hero_stat else None,
            "hero_specialization": [
                {
                    "hero_id": stat.hero_id,
                    "hero_power": stat.hero_power,
                    "win_rate": stat.win_rate,
                    "times_played": stat.times_played
                }
                for stat in hero_stats
            ],
            "team": team,
            "performance_metrics": {
                "ovr": player.ovr,
                "focus": player.focus,
                "mental": player.mental,
                "fatigue": player.fatigue,
                "experience_level": player.experience_level
            }
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player analytics {player_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch player analytics"
        )