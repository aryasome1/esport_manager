"""
Coach Management Router
Handles coach CRUD operations, team assignments, and coaching analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Coach, Team, User
from ..schemas.schemas import (
    CoachCreate, CoachUpdate, Coach as CoachSchema,
    CoachResponse, CoachType, PaginationParams, 
    PaginatedResponse, BaseResponse, ErrorResponse
)

router = APIRouter(prefix="/coaches", tags=["Coaches"])
logger = logging.getLogger(__name__)

def get_coach_or_404(db: Session, coach_id: int) -> Coach:
    """Helper function to get coach or raise 404"""
    coach = db.query(Coach).filter(Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coach with id {coach_id} not found"
        )
    return coach

@router.get("/", response_model=PaginatedResponse)
async def get_coaches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    coach_type: Optional[CoachType] = Query(None),
    search: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all coaches with optional filtering and pagination
    """
    try:
        query = db.query(Coach)
        
        # Apply filters
        if coach_type:
            query = query.filter(Coach.coach_type == coach_type.value)
        
        if min_experience is not None:
            query = query.filter(Coach.experience_years >= min_experience)
        
        if search:
            search_filter = or_(
                Coach.name.ilike(f"%{search}%"),
                Coach.email.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        coaches = query.order_by(Coach.experience_years.desc()).offset(skip).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=coaches,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching coaches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch coaches"
        )

@router.get("/{coach_id}", response_model=CoachResponse)
async def get_coach(
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get coach details with managed teams
    """
    try:
        coach = get_coach_or_404(db, coach_id)
        
        # Get managed teams
        teams = db.query(Team).filter(Team.coach_id == coach_id).all()
        
        response_data = {
            **coach.__dict__,
            'teams': teams
        }
        
        return CoachResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach {coach_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch coach details"
        )

@router.post("/", response_model=CoachSchema, status_code=status.HTTP_201_CREATED)
async def create_coach(
    coach_data: CoachCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new coach
    """
    try:
        # Check if coach email already exists
        existing_coach = db.query(Coach).filter(Coach.email == coach_data.email).first()
        if existing_coach:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coach with this email already exists"
            )
        
        from ..utils.auth_utils import get_password_hash
        
        # Create coach
        db_coach = Coach(
            name=coach_data.name,
            email=coach_data.email,
            username=coach_data.username,
            password_hash=get_password_hash(coach_data.password),
            coach_type=coach_data.coach_type.value,
            experience_years=coach_data.experience_years,
            tactical_knowledge=coach_data.tactical_knowledge
        )
        
        db.add(db_coach)
        db.commit()
        db.refresh(db_coach)
        
        logger.info(f"Coach created: {coach_data.name}")
        return db_coach
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating coach: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create coach"
        )

@router.put("/{coach_id}", response_model=CoachSchema)
async def update_coach(
    coach_id: int,
    coach_update: CoachUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update coach details
    """
    try:
        coach = get_coach_or_404(db, coach_id)
        update_data = coach_update.dict(exclude_unset=True)
        
        # Update fields
        for field, value in update_data.items():
            if field == "coach_type" and value:
                setattr(coach, field, value.value)
            else:
                setattr(coach, field, value)
        
        coach.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(coach)
        
        logger.info(f"Coach updated: {coach.name}")
        return coach
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating coach {coach_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update coach"
        )

@router.delete("/{coach_id}", response_model=BaseResponse)
async def delete_coach(
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete coach
    """
    try:
        coach = get_coach_or_404(db, coach_id)
        
        # Check if coach has teams
        teams_count = db.query(Team).filter(Team.coach_id == coach_id).count()
        if teams_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete coach who manages teams. Remove teams first."
            )
        
        db.delete(coach)
        db.commit()
        
        logger.info(f"Coach deleted: {coach.name}")
        return BaseResponse(message="Coach deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting coach {coach_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete coach"
        )

@router.get("/{coach_id}/analytics")
async def get_coach_analytics(
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get coach performance analytics
    """
    try:
        coach = get_coach_or_404(db, coach_id)
        
        # Get managed teams
        teams = db.query(Team).filter(Team.coach_id == coach_id).all()
        
        # Calculate analytics
        total_teams = len(teams)
        total_players = sum(len(team.players) for team in teams) if teams else 0
        
        # Team performance metrics
        team_performances = []
        for team in teams:
            if team.total_matches > 0:
                win_rate = (team.wins / team.total_matches) * 100
                team_performances.append({
                    "team": team,
                    "win_rate": round(win_rate, 2),
                    "total_matches": team.total_matches,
                    "team_chemistry": team.team_chemistry
                })
        
        # Coach effectiveness metrics
        avg_team_win_rate = sum(perf["win_rate"] for perf in team_performances) / len(team_performances) if team_performances else 0
        avg_chemistry = sum(perf["team_chemistry"] for perf in team_performances) / len(team_performances) if team_performances else 0
        
        analytics = {
            "coach": coach,
            "total_teams": total_teams,
            "total_players": total_players,
            "avg_team_win_rate": round(avg_team_win_rate, 2),
            "avg_team_chemistry": round(avg_chemistry, 2),
            "experience_years": coach.experience_years,
            "tactical_knowledge": coach.tactical_knowledge,
            "coach_type": coach.coach_type,
            "team_performances": team_performances,
            "effectiveness_rating": calculate_effectiveness_rating(coach, team_performances),
            "recommendations": generate_coach_recommendations(coach, team_performances)
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach analytics {coach_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch coach analytics"
        )

def calculate_effectiveness_rating(coach: Coach, team_performances: List[Dict]) -> float:
    """Calculate coach effectiveness rating based on various metrics"""
    if not team_performances:
        return 50.0
    
    # Base effectiveness on tactical knowledge
    base_rating = coach.tactical_knowledge
    
    # Adjust based on experience
    experience_bonus = min(coach.experience_years * 2, 20)  # Max 20 point bonus
    
    # Adjust based on team performance
    avg_win_rate = sum(perf["win_rate"] for perf in team_performances) / len(team_performances)
    performance_bonus = (avg_win_rate - 50) * 0.4  # Scale win rate to rating
    
    # Coach type specific bonuses
    type_bonuses = {
        "motivator": 5,
        "strategist": 8,
        "tough_coach": 3,
        "flexible_coach": 6
    }
    type_bonus = type_bonuses.get(coach.coach_type, 0)
    
    effectiveness = base_rating + experience_bonus + performance_bonus + type_bonus
    return round(max(0, min(100, effectiveness)), 2)

def generate_coach_recommendations(coach: Coach, team_performances: List[Dict]) -> List[str]:
    """Generate improvement recommendations for coach"""
    recommendations = []
    
    if coach.experience_years < 2:
        recommendations.append("Consider additional coaching certifications to improve credibility")
    
    if coach.tactical_knowledge < 70:
        recommendations.append("Focus on studying advanced strategic concepts")
    
    if team_performances:
        avg_win_rate = sum(perf["win_rate"] for perf in team_performances) / len(team_performances)
        if avg_win_rate < 40:
            recommendations.append("Work on team communication and strategy development")
        
        avg_chemistry = sum(perf["team_chemistry"] for perf in team_performances) / len(team_performances)
        if avg_chemistry < 60:
            recommendations.append("Implement team building activities to improve chemistry")
    
    return recommendations

# Import datetime for updated_at
from datetime import datetime