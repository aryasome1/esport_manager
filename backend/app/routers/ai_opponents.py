"""
AI Opponent Management Router
Handles AI opponent profiles, difficulty settings, and AI-generated opponents
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import random

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import User, Team, Match
from ..models.division_models import AIOpponent
from ..schemas.schemas import (
    PaginationParams, PaginatedResponse, BaseResponse, AIProfileResponse, AIProfileUpdate
)

router = APIRouter(prefix="/ai-opponents", tags=["AI Opponents"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=PaginatedResponse)
async def get_ai_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    difficulty: Optional[int] = Query(None, ge=1, le=5),
    ai_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI opponent profiles with filtering"""
    try:
        query = db.query(AIOpponent)
        
        if difficulty:
            query = query.filter(AIOpponent.difficulty_level == difficulty)
        if ai_type:
            query = query.filter(AIOpponent.ai_type == ai_type)
        
        total = query.count()
        profiles = query.order_by(AIOpponent.created_at.desc()).offset(skip).limit(limit).all()
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=profiles,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
    except Exception as e:
        logger.error(f"Error fetching AI profiles: {e}")
        raise HTTPException(500, "Failed to fetch AI profiles")

@router.get("/{profile_id}", response_model=AIProfileResponse)
async def get_ai_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI profile details"""
    try:
        profile = db.query(AIOpponent).filter(AIOpponent.id == profile_id).first()
        if not profile:
            raise HTTPException(404, "AI profile not found")
        
        return profile
    except Exception as e:
        logger.error(f"Error fetching AI profile {profile_id}: {e}")
        raise HTTPException(500, "Failed to fetch AI profile")

@router.post("/", status_code=201)
async def create_ai_profile(
    name: str = Query(..., description="AI opponent name"),
    difficulty_level: int = Query(..., ge=1, le=5, description="AI difficulty level 1-5"),
    ai_type: str = Query(default="adaptive", description="AI type: adaptive, reactive, predictive"),
    aggression_level: float = Query(default=50.0, ge=0.0, le=100.0, description="Aggression level 0-100"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new AI opponent profile"""
    try:
        # Check if name already exists
        existing = db.query(AIOpponent).filter(AIOpponent.name == name).first()
        if existing:
            raise HTTPException(400, "AI profile with this name already exists")
        
        profile = AIOpponent(
            name=name,
            difficulty_level=difficulty_level,
            ai_type=ai_type,
            aggression_level=aggression_level,
            tactical_flexibility=50.0,
            economy_management=50.0,
            communication_quality=50.0
        )
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        logger.info(f"AI profile created: {name}")
        return {
            "message": "AI profile created successfully",
            "ai_profile": profile
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating AI profile: {e}")
        raise HTTPException(500, "Failed to create AI profile")

@router.put("/{profile_id}", response_model=AIProfileResponse)
async def update_ai_profile(
    profile_id: int,
    profile_update: AIProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update AI profile"""
    try:
        profile = db.query(AIOpponent).filter(AIOpponent.id == profile_id).first()
        if not profile:
            raise HTTPException(404, "AI profile not found")
        
        update_data = profile_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        profile.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(profile)
        
        logger.info(f"AI profile updated: {profile.name}")
        return profile
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating AI profile {profile_id}: {e}")
        raise HTTPException(500, "Failed to update AI profile")

@router.delete("/{profile_id}", response_model=BaseResponse)
async def delete_ai_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete AI profile"""
    try:
        profile = db.query(AIOpponent).filter(AIOpponent.id == profile_id).first()
        if not profile:
            raise HTTPException(404, "AI profile not found")
        
        # Check if AI has been used in matches
        from ..models.division_models import AIMatch
        matches_count = db.query(AIMatch).filter(AIMatch.ai_opponent_id == profile_id).count()
        
        if matches_count > 0:
            # Soft delete - we can't delete if it has match history
            raise HTTPException(400, "Cannot delete AI profile that has match history")
        
        db.delete(profile)
        db.commit()
        
        logger.info(f"AI profile deleted: {profile.name}")
        return BaseResponse(message="AI profile deleted successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting AI profile {profile_id}: {e}")
        raise HTTPException(500, "Failed to delete AI profile")

@router.post("/generate")
async def generate_ai_opponent(
    difficulty_level: int = Query(..., ge=1, le=5),
    ai_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate random AI opponent with specified difficulty"""
    try:
        # Predefined AI names and traits
        ai_names = [
            "IronClad", "Shadow Walker", "Crimson Flash", "Storm Breaker",
            "Void Weaver", "Phoenix Rising", "Steel Heart", "Night Stalker",
            "Thunder Strike", "Crystal Guard", "Blaze Fury", "Mystic Sage"
        ]
        
        available_names = [name for name in ai_names if not db.query(AIOpponent).filter(AIOpponent.name == name).first()]
        
        if not available_names:
            available_names = ai_names  # Fallback if all names taken
        
        # Generate AI type if not specified
        if not ai_type:
            ai_types = ["adaptive", "reactive", "predictive"]
            ai_type = random.choice(ai_types)
        
        # Generate characteristics based on difficulty
        base_stats = {
            1: {"aggression": 30, "tactical": 20, "economy": 25, "communication": 20},
            2: {"aggression": 40, "tactical": 35, "economy": 40, "communication": 35},
            3: {"aggression": 50, "tactical": 50, "economy": 50, "communication": 50},
            4: {"aggression": 65, "tactical": 70, "economy": 65, "communication": 65},
            5: {"aggression": 80, "tactical": 85, "economy": 80, "communication": 75}
        }
        
        stats = base_stats.get(difficulty_level, base_stats[3])
        
        # Add some randomness
        aggression_level = max(0, min(100, stats["aggression"] + random.randint(-10, 10)))
        tactical_flexibility = max(0, min(100, stats["tactical"] + random.randint(-10, 10)))
        economy_management = max(0, min(100, stats["economy"] + random.randint(-10, 10)))
        communication_quality = max(0, min(100, stats["communication"] + random.randint(-10, 10)))
        
        # Select random name
        name = random.choice(available_names)
        
        # Create AI profile
        ai_profile = AIOpponent(
            name=name,
            difficulty_level=difficulty_level,
            ai_type=ai_type,
            aggression_level=aggression_level,
            tactical_flexibility=tactical_flexibility,
            economy_management=economy_management,
            communication_quality=communication_quality
        )
        
        db.add(ai_profile)
        db.commit()
        db.refresh(ai_profile)
        
        logger.info(f"Generated AI opponent: {name} (Difficulty: {difficulty_level})")
        return {
            "message": "AI opponent generated successfully",
            "ai_profile": ai_profile,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating AI opponent: {e}")
        raise HTTPException(500, "Failed to generate AI opponent")

@router.get("/{profile_id}/performance")
async def get_ai_performance(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI opponent performance analytics"""
    try:
        profile = db.query(AIOpponent).filter(AIOpponent.id == profile_id).first()
        if not profile:
            raise HTTPException(404, "AI profile not found")
        
        # Get AI matches
        from ..models.division_models import AIMatch
        ai_matches = db.query(AIMatch).filter(AIMatch.ai_opponent_id == profile_id).all()
        
        # Calculate performance metrics
        total_matches = len(ai_matches)
        wins = sum(1 for match in ai_matches if match.human_wins == False)  # AI wins when human doesn't win
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
        
        # Performance trends (simplified)
        recent_matches = ai_matches[-10:] if len(ai_matches) > 10 else ai_matches
        recent_wins = sum(1 for match in recent_matches if match.human_wins == False)
        recent_form = (recent_wins / len(recent_matches) * 100) if recent_matches else 0
        
        # Difficulty progression
        difficulty_progression = calculate_difficulty_progression(profile, ai_matches)
        
        performance = {
            "ai_profile": profile,
            "overall_performance": {
                "total_matches": total_matches,
                "wins": wins,
                "losses": total_matches - wins,
                "win_rate": round(win_rate, 2)
            },
            "recent_form": {
                "matches": len(recent_matches),
                "wins": recent_wins,
                "form_percentage": round(recent_form, 2)
            },
            "difficulty_analysis": difficulty_progression,
            "strengths": identify_ai_strengths(profile, ai_matches),
            "weaknesses": identify_ai_weaknesses(profile, ai_matches),
            "improvement_areas": suggest_ai_improvements(profile, win_rate)
        }
        
        return performance
        
    except Exception as e:
        logger.error(f"Error fetching AI performance {profile_id}: {e}")
        raise HTTPException(500, "Failed to fetch AI performance")

def calculate_difficulty_progression(profile: AIOpponent, matches: List[Match]) -> Dict[str, Any]:
    """Calculate AI difficulty progression over matches"""
    if not matches:
        return {"progression": "No matches played", "difficulty_consistency": 100}
    
    # Analyze match performance relative to difficulty level
    expected_win_rate = (11 - profile.difficulty_level) * 10  # Higher difficulty = lower expected win rate
    actual_win_rate = sum(1 for match in matches if match.winner_team_id == f"ai_{profile.id}") / len(matches) * 100
    
    difficulty_consistency = 100 - abs(expected_win_rate - actual_win_rate)
    
    return {
        "expected_win_rate": expected_win_rate,
        "actual_win_rate": round(actual_win_rate, 2),
        "difficulty_consistency": round(max(0, difficulty_consistency), 2),
        "progression": "Improving" if actual_win_rate > expected_win_rate else "Stable"
    }

def identify_ai_strengths(profile: AIOpponent, matches: List[Match]) -> List[str]:
    """Identify AI opponent strengths"""
    strengths = []
    
    if profile.aggression_level > 0.8:
        strengths.append("High aggression creates pressure on opponents")
    
    if profile.difficulty_level >= 8:
        strengths.append("Excellent strategic decision making")
    
    if profile.strategic_style == "opportunistic":
        strengths.append("Capitalizes on opponent mistakes effectively")
    
    return strengths

def identify_ai_weaknesses(profile: AIOpponent, matches: List[Match]) -> List[str]:
    """Identify AI opponent weaknesses"""
    weaknesses = []
    
    if profile.aggression_level < 0.3:
        weaknesses.append("May be too passive in key moments")
    
    if profile.difficulty_level <= 3:
        weaknesses.append("Lower difficulty makes predictable moves")
    
    if profile.strategic_style == "defensive":
        weaknesses.append("Can struggle against aggressive opponents")
    
    return weaknesses

def suggest_ai_improvements(profile: AIOpponent, win_rate: float) -> List[str]:
    """Suggest improvements for AI opponent"""
    improvements = []
    
    if win_rate < 30:
        improvements.append("Consider reducing difficulty level for better balance")
    elif win_rate > 80:
        improvements.append("Increase difficulty level to maintain challenge")
    
    if profile.aggression_level < 40:
        improvements.append("Increase aggression level for more dynamic gameplay")
    
    if profile.tactical_flexibility < 50:
        improvements.append("Add more tactical variety to prevent predictability")
    
    if profile.communication_quality < 60:
        improvements.append("Improve AI team communication algorithms")
    
    return improvements

# Import necessary modules
from datetime import datetime
from sqlalchemy import or_