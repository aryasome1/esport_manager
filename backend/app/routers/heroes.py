"""
Hero Management Router
Handles hero CRUD operations, preferred lanes, and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Hero, HeroStat, Player, User
from ..schemas.schemas import (
    HeroCreate, HeroUpdate, Hero as HeroSchema,
    HeroWithStats, RoleType, PaginationParams, PaginatedResponse, 
    BaseResponse, ErrorResponse
)

router = APIRouter(prefix="/heroes", tags=["Heroes"])
logger = logging.getLogger(__name__)

def get_hero_or_404(db: Session, hero_id: int) -> Hero:
    """Helper function to get hero or raise 404"""
    hero = db.query(Hero).filter(Hero.id == hero_id).first()
    if not hero:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hero with id {hero_id} not found"
        )
    return hero

@router.get("/", response_model=PaginatedResponse)
async def get_heroes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[RoleType] = Query(None),
    search: Optional[str] = Query(None),
    min_power: Optional[float] = Query(None, ge=0.0, le=100.0),
    max_difficulty: Optional[int] = Query(None, ge=1, le=5),
    role_specific: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all heroes with optional filtering and pagination
    """
    try:
        query = db.query(Hero)
        
        # Apply filters
        if role:
            # Note: This would need proper JSON handling in a real implementation
            # For now, we'll use a simple approach
            pass
        
        if search:
            search_filter = or_(
                Hero.name.ilike(f"%{search}%"),
                Hero.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if min_power is not None:
            query = query.filter(Hero.base_power >= min_power)
        
        if max_difficulty is not None:
            query = query.filter(Hero.difficulty <= max_difficulty)
        
        if role_specific is not None:
            query = query.filter(Hero.role_specific == role_specific)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        heroes = query.order_by(Hero.base_power.desc()).offset(skip).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=heroes,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching heroes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch heroes"
        )

@router.get("/{hero_id}", response_model=HeroWithStats)
async def get_hero(
    hero_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get hero details with player statistics
    """
    try:
        hero = get_hero_or_404(db, hero_id)
        
        # Get hero statistics
        hero_stats = db.query(HeroStat).filter(HeroStat.hero_id == hero_id).all()
        
        response_data = {
            **hero.__dict__,
            'hero_stats': hero_stats
        }
        
        return HeroWithStats(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching hero {hero_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch hero details"
        )

@router.post("/", response_model=HeroSchema, status_code=status.HTTP_201_CREATED)
async def create_hero(
    hero_data: HeroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new hero
    """
    try:
        # Check if hero name already exists
        existing_hero = db.query(Hero).filter(Hero.name == hero_data.name).first()
        if existing_hero:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hero with this name already exists"
            )
        
        # Create hero
        db_hero = Hero(
            name=hero_data.name,
            description=hero_data.description,
            base_power=hero_data.base_power,
            difficulty=hero_data.difficulty,
            role_specific=hero_data.role_specific,
            preferred_lanes=[lane.value for lane in hero_data.preferred_lanes]
        )
        
        db.add(db_hero)
        db.commit()
        db.refresh(db_hero)
        
        logger.info(f"Hero created: {hero_data.name}")
        return db_hero
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating hero: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create hero"
        )

@router.put("/{hero_id}", response_model=HeroSchema)
async def update_hero(
    hero_id: int,
    hero_update: HeroUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update hero details
    """
    try:
        hero = get_hero_or_404(db, hero_id)
        update_data = hero_update.dict(exclude_unset=True)
        
        # Update fields
        for field, value in update_data.items():
            if field == "preferred_lanes" and value:
                setattr(hero, field, [lane.value for lane in value])
            else:
                setattr(hero, field, value)
        
        hero.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(hero)
        
        logger.info(f"Hero updated: {hero.name}")
        return hero
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating hero {hero_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update hero"
        )

@router.delete("/{hero_id}", response_model=BaseResponse)
async def delete_hero(
    hero_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete hero
    """
    try:
        hero = get_hero_or_404(db, hero_id)
        
        # Check if hero is used in any stats
        hero_stats_count = db.query(HeroStat).filter(HeroStat.hero_id == hero_id).count()
        if hero_stats_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete hero that has player statistics. Remove statistics first."
            )
        
        db.delete(hero)
        db.commit()
        
        logger.info(f"Hero deleted: {hero.name}")
        return BaseResponse(message="Hero deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting hero {hero_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete hero"
        )

@router.get("/{hero_id}/analytics")
async def get_hero_analytics(
    hero_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get hero analytics and usage statistics
    """
    try:
        hero = get_hero_or_404(db, hero_id)
        
        # Get all stats for this hero
        hero_stats = db.query(HeroStat).filter(HeroStat.hero_id == hero_id).all()
        
        if not hero_stats:
            return {
                "hero": hero,
                "total_players": 0,
                "avg_hero_power": 0,
                "avg_win_rate": 0,
                "popularity_rank": 0,
                "player_breakdown": [],
                "most_effective_player": None
            }
        
        # Calculate analytics
        total_players = len(hero_stats)
        avg_hero_power = sum(stat.hero_power for stat in hero_stats) / total_players
        avg_win_rate = sum(stat.win_rate for stat in hero_stats) / total_players
        total_matches = sum(stat.times_played for stat in hero_stats)
        
        # Find most effective player
        most_effective_stat = max(hero_stats, key=lambda x: x.hero_power)
        most_effective_player = db.query(Player).filter(
            Player.id == most_effective_stat.player_id
        ).first()
        
        # Get popularity rank (compare with other heroes)
        all_hero_stats = db.query(HeroStat).all()
        hero_popularity = {}
        for stat in all_hero_stats:
            hero_popularity[stat.hero_id] = hero_popularity.get(stat.hero_id, 0) + stat.times_played
        
        sorted_heroes = sorted(hero_popularity.items(), key=lambda x: x[1], reverse=True)
        popularity_rank = next((i + 1 for i, (hid, _) in enumerate(sorted_heroes) if hid == hero_id), 0)
        
        # Player breakdown by skill level
        player_breakdown = []
        for stat in hero_stats:
            player = db.query(Player).filter(Player.id == stat.player_id).first()
            if player:
                player_breakdown.append({
                    "player": player,
                    "hero_power": stat.hero_power,
                    "times_played": stat.times_played,
                    "win_rate": stat.win_rate,
                    "player_ovr": player.ovr
                })
        
        # Sort by hero power
        player_breakdown.sort(key=lambda x: x["hero_power"], reverse=True)
        
        analytics = {
            "hero": hero,
            "total_players": total_players,
            "total_matches": total_matches,
            "avg_hero_power": round(avg_hero_power, 2),
            "avg_win_rate": round(avg_win_rate, 2),
            "popularity_rank": popularity_rank,
            "ban_count": hero.ban_count,
            "most_effective_player": {
                "player": most_effective_player,
                "hero_power": most_effective_stat.hero_power,
                "times_played": most_effective_stat.times_played,
                "win_rate": most_effective_stat.win_rate
            },
            "player_breakdown": player_breakdown,
            "skill_distribution": {
                "novice": len([p for p in player_breakdown if p["hero_power"] < 30]),
                "intermediate": len([p for p in player_breakdown if 30 <= p["hero_power"] < 70]),
                "expert": len([p for p in player_breakdown if p["hero_power"] >= 70])
            }
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching hero analytics {hero_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch hero analytics"
        )

@router.get("/popular/best", response_model=List[HeroSchema])
async def get_most_popular_heroes(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get most popular heroes by usage
    """
    try:
        # Get hero popularity based on total times played
        hero_stats = db.query(HeroStat).all()
        hero_popularity = {}
        
        for stat in hero_stats:
            if stat.hero_id not in hero_popularity:
                hero_popularity[stat.hero_id] = {
                    "hero_id": stat.hero_id,
                    "total_usage": 0,
                    "avg_power": 0,
                    "hero_powers": []
                }
            
            hero_popularity[stat.hero_id]["total_usage"] += stat.times_played
            hero_popularity[stat.hero_id]["hero_powers"].append(stat.hero_power)
        
        # Sort by popularity and get hero details
        popular_hero_ids = sorted(
            hero_popularity.items(), 
            key=lambda x: x[1]["total_usage"], 
            reverse=True
        )[:limit]
        
        popular_heroes = []
        for hero_id, data in popular_hero_ids:
            hero = db.query(Hero).filter(Hero.id == hero_id).first()
            if hero:
                hero_data = hero.__dict__.copy()
                hero_data["total_usage"] = data["total_usage"]
                hero_data["avg_power"] = sum(data["hero_powers"]) / len(data["hero_powers"])
                popular_heroes.append(hero)
        
        return popular_heroes
        
    except Exception as e:
        logger.error(f"Error fetching popular heroes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch popular heroes"
        )

@router.get("/role/{role_name}", response_model=List[HeroSchema])
async def get_heroes_by_role(
    role_name: RoleType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get heroes suitable for specific role
    """
    try:
        # Note: This would need proper JSON query handling in production
        # For now, return all heroes as a placeholder
        heroes = db.query(Hero).filter(Hero.role_specific == True).all()
        
        # Filter by role in a real implementation
        # This is simplified for demonstration
        suitable_heroes = []
        for hero in heroes:
            # In production, you'd query the JSON preferred_lanes field
            if hasattr(hero, 'preferred_lanes') and role_name.value in hero.preferred_lanes:
                suitable_heroes.append(hero)
            elif not hasattr(hero, 'preferred_lanes') or not hero.preferred_lanes:
                # Include non-role-specific heroes
                suitable_heroes.append(hero)
        
        return suitable_heroes
        
    except Exception as e:
        logger.error(f"Error fetching heroes by role {role_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch heroes by role"
        )

# Import datetime for updated_at
from datetime import datetime