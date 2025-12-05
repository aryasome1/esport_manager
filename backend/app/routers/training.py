"""
Training Session Management Router
Handles training session CRUD operations, improvement calculations, and training analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import TrainingSession, Player, Hero, Coach, User
from ..schemas.schemas import (
    TrainingSessionCreate, TrainingSessionResponse,
    PaginationParams, PaginatedResponse, BaseResponse
)

router = APIRouter(prefix="/training", tags=["Training"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=PaginatedResponse)
async def get_training_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    player_id: Optional[int] = Query(None),
    coach_id: Optional[int] = Query(None),
    hero_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get training sessions with filtering"""
    try:
        query = db.query(TrainingSession)
        
        if player_id:
            query = query.filter(TrainingSession.player_id == player_id)
        if coach_id:
            query = query.filter(TrainingSession.coach_id == coach_id)
        if hero_id:
            query = query.filter(TrainingSession.hero_id == hero_id)
        
        total = query.count()
        sessions = query.order_by(TrainingSession.session_date.desc()).offset(skip).limit(limit).all()
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=sessions,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
    except Exception as e:
        logger.error(f"Error fetching training sessions: {e}")
        raise HTTPException(500, "Failed to fetch training sessions")

@router.post("/", response_model=TrainingSessionResponse)
async def create_training_session(
    training_data: TrainingSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create training session"""
    try:
        # Validate player and hero exist
        player = db.query(Player).filter(Player.id == training_data.player_id).first()
        hero = db.query(Hero).filter(Hero.id == training_data.hero_id).first()
        
        if not player:
            raise HTTPException(404, "Player not found")
        if not hero:
            raise HTTPException(404, "Hero not found")
        
        # Calculate improvement based on various factors
        improvement = calculate_improvement(player, hero, training_data.hours, training_data.coach_id)
        
        session = TrainingSession(
            player_id=training_data.player_id,
            hero_id=training_data.hero_id,
            hours=training_data.hours,
            coach_id=training_data.coach_id,
            improvement=improvement,
            session_date=datetime.utcnow()
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Update player training hours and potentially OVR
        player.training_hours += training_data.hours
        if improvement > 0:
            player.ovr = min(100, player.ovr + int(improvement * 0.1))
        
        db.commit()
        
        return session
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating training session: {e}")
        raise HTTPException(500, "Failed to create training session")

def calculate_improvement(player: Player, hero: Hero, hours: float, coach_id: Optional[int]) -> float:
    """Calculate expected improvement from training session"""
    base_improvement = hours * 2.0  # Base improvement rate
    
    # Player factors
    player_factor = player.focus / 100.0
    fatigue_penalty = (100 - player.fatigue) / 100.0
    mental_bonus = player.mental / 100.0
    
    # Hero factors
    difficulty_penalty = hero.difficulty / 5.0  # Harder heroes give less improvement
    power_bonus = hero.base_power / 100.0
    
    # Coach factor
    coach_bonus = 1.0
    if coach_id:
        # Coach impact would be calculated here
        coach_bonus = 1.2  # 20% bonus with coach
    
    total_improvement = base_improvement * player_factor * fatigue_penalty * mental_bonus * \
                       (1 + power_bonus - difficulty_penalty) * coach_bonus
    
    return min(20.0, max(0.0, total_improvement))  # Cap at 20 improvement points

from datetime import datetime