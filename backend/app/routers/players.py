"""
Player Management Router
Handles player CRUD operations, hero stats, team assignments, and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Player, Hero, HeroStat, Team, User
from ..schemas.schemas import (
    PlayerCreate, PlayerUpdate, Player as PlayerSchema,
    PlayerWithHeroStats, HeroStatCreate, HeroStatUpdate, HeroStatResponse,
    PaginationParams, PaginatedResponse, BaseResponse, ErrorResponse
)

router = APIRouter(prefix="/players", tags=["Players"])
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all players with optional filtering and pagination
    """
    try:
        query = db.query(Player)
        
        # Apply filters
        if team_id:
            query = query.filter(Player.team_id == team_id)
        
        if role:
            query = query.filter(Player.current_role == role)
        
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
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=players,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching players: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch players"
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
        player_with_stats = db.query(Player).filter(Player.id == player_id).first()
        hero_stats = db.query(HeroStat).filter(HeroStat.player_id == player_id).all()
        
        response_data = {
            **player_with_stats.__dict__,
            'hero_stats': hero_stats
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
            username=player_data.username,
            current_role=player_data.current_role,
            division_preference=player_data.division_preference.value if player_data.division_preference else "moba"
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
            setattr(hero_stat, field, value)
        
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

# Import datetime for updated_at
from datetime import datetime