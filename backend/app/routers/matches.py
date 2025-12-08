"""
Match Management Router
Handles match CRUD operations, scheduling, scoring, and match analytics
FIXED: Updated GameMode to GameModeType to match schema changes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Match, Team, DraftSession, User
# [FIX] Import GameModeType instead of GameMode
from ..schemas.schemas import (
    MatchCreate, MatchUpdate, MatchResponse as MatchResponseSchema,
    MatchStatus, GameModeType, PaginationParams, 
    PaginatedResponse, BaseResponse, ErrorResponse
)

router = APIRouter(prefix="/matches", tags=["Matches"])
logger = logging.getLogger(__name__)

def get_match_or_404(db: Session, match_id: int) -> Match:
    """Helper function to get match or raise 404"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )
    return match

@router.get("/", response_model=PaginatedResponse)
async def get_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[MatchStatus] = Query(None),
    team_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),  # ISO format date
    date_to: Optional[str] = Query(None),    # ISO format date
    game_mode: Optional[GameModeType] = Query(None), # [FIX] Updated type hint
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all matches with optional filtering and pagination
    """
    try:
        query = db.query(Match)
        
        # Apply filters
        if status:
            query = query.filter(Match.status == status.value)
        
        if team_id:
            query = query.filter(or_(Match.team1_id == team_id, Match.team2_id == team_id))
        
        if game_mode:
            # [FIX] Compare against Enum value
            query = query.filter(Match.game_mode == game_mode.value)
        
        if date_from:
            try:
                date_from_dt = datetime.fromisoformat(date_from)
                query = query.filter(Match.scheduled_at >= date_from_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format")
        
        if date_to:
            try:
                date_to_dt = datetime.fromisoformat(date_to)
                query = query.filter(Match.scheduled_at <= date_to_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format")
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        matches = query.order_by(Match.scheduled_at.desc()).offset(skip).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=matches,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch matches"
        )

@router.get("/{match_id}", response_model=MatchResponseSchema)
async def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get match details with teams and draft session
    """
    try:
        match = get_match_or_404(db, match_id)
        
        # Get teams
        team1 = db.query(Team).filter(Team.id == match.team1_id).first()
        team2 = db.query(Team).filter(Team.id == match.team2_id).first()
        
        # Get draft session if exists
        draft_session = db.query(DraftSession).filter(
            DraftSession.match_id == match_id
        ).first()
        
        # Get winner team if match is completed
        winner = None
        if match.winner_team_id:
            winner = db.query(Team).filter(Team.id == match.winner_team_id).first()
        
        # Prepare response data
        response_data = {
            **match.__dict__,
            'team1': team1,
            'team2': team2,
            'winner': winner,
            'draft_session': draft_session
        }
        
        return MatchResponseSchema(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch match details"
        )

@router.post("/", response_model=MatchResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new match
    """
    try:
        # Validate teams exist
        team1 = db.query(Team).filter(Team.id == match_data.team1_id).first()
        if not team1:
            raise HTTPException(status_code=400, detail="Team 1 not found")
        
        team2 = db.query(Team).filter(Team.id == match_data.team2_id).first()
        if not team2:
            raise HTTPException(status_code=400, detail="Team 2 not found")
        
        # Check if teams are different
        if match_data.team1_id == match_data.team2_id:
            raise HTTPException(status_code=400, detail="Teams must be different")
        
        # Check for scheduling conflicts
        conflicting_match = db.query(Match).filter(
            and_(
                or_(
                    Match.team1_id == match_data.team1_id,
                    Match.team1_id == match_data.team2_id,
                    Match.team2_id == match_data.team1_id,
                    Match.team2_id == match_data.team2_id
                ),
                Match.status.in_(["scheduled", "drafting", "in_progress"]),
                Match.scheduled_at.between(
                    match_data.scheduled_at - timedelta(hours=2),
                    match_data.scheduled_at + timedelta(hours=2)
                )
            )
        ).first()
        
        if conflicting_match:
            raise HTTPException(
                status_code=400, 
                detail="Scheduling conflict: One of the teams has a match within 2 hours"
            )
        
        # Create match
        db_match = Match(
            team1_id=match_data.team1_id,
            team2_id=match_data.team2_id,
            scheduled_at=match_data.scheduled_at,
            # [FIX] Use value from Enum
            game_mode=match_data.game_mode.value if match_data.game_mode else None,
            status="scheduled"
        )
        
        db.add(db_match)
        db.commit()
        db.refresh(db_match)
        
        logger.info(f"Match created: {team1.name} vs {team2.name}")
        return db_match
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating match: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create match"
        )

@router.put("/{match_id}", response_model=MatchResponseSchema)
async def update_match(
    match_id: int,
    match_update: MatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update match details
    """
    try:
        match = get_match_or_404(db, match_id)
        update_data = match_update.dict(exclude_unset=True)
        
        # Handle status changes
        if "status" in update_data:
            old_status = match.status
            new_status = update_data["status"]
            
            # Validate status transition
            valid_transitions = {
                "scheduled": ["drafting", "cancelled"],
                "drafting": ["in_progress", "cancelled"],
                "in_progress": ["completed", "cancelled"],
                "completed": [],  # Final state
                "cancelled": []   # Final state
            }
            
            # Handle enum comparisons safely
            old_status_val = old_status.value if hasattr(old_status, 'value') else old_status
            new_status_val = new_status.value if hasattr(new_status, 'value') else new_status
            
            if new_status_val not in valid_transitions.get(old_status_val, []):
                # Allow force update if needed or just log warning
                logger.warning(f"Invalid status transition from {old_status_val} to {new_status_val}")
            
            # Handle specific status changes
            if new_status == MatchStatus.IN_PROGRESS and not match.draft_session:
                # Create draft session if moving to in_progress
                draft_session = DraftSession(match_id=match_id)
                db.add(draft_session)
            
            if new_status == MatchStatus.COMPLETED:
                match.played_at = datetime.utcnow()
        
        # Update fields
        for field, value in update_data.items():
            if field == "status" and value:
                setattr(match, field, value.value)
            else:
                setattr(match, field, value)
        
        match.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(match)
        
        logger.info(f"Match updated: {match.id}")
        return match
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update match"
        )

@router.delete("/{match_id}", response_model=BaseResponse)
async def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete match (only if not started)
    """
    try:
        match = get_match_or_404(db, match_id)
        
        # Only allow deletion if match hasn't started
        status_val = match.status.value if hasattr(match.status, 'value') else match.status
        if status_val in ["in_progress", "completed"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete match that has started or completed"
            )
        
        # Delete associated draft session
        draft_session = db.query(DraftSession).filter(
            DraftSession.match_id == match_id
        ).first()
        if draft_session:
            db.delete(draft_session)
        
        db.delete(match)
        db.commit()
        
        logger.info(f"Match deleted: {match_id}")
        return BaseResponse(message="Match deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete match"
        )

@router.post("/{match_id}/complete", response_model=BaseResponse)
async def complete_match(
    match_id: int,
    team1_score: int = Query(..., ge=0),
    team2_score: int = Query(..., ge=0),
    winner_team_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Complete match with final scores
    """
    try:
        match = get_match_or_404(db, match_id)
        
        # Validate match is in progress
        status_val = match.status.value if hasattr(match.status, 'value') else match.status
        if status_val != "in_progress":
            raise HTTPException(
                status_code=400,
                detail="Only matches in progress can be completed"
            )
        
        # Auto-determine winner if not provided
        if not winner_team_id:
            if team1_score > team2_score:
                winner_team_id = match.team1_id
            elif team2_score > team1_score:
                winner_team_id = match.team2_id
            else:
                raise HTTPException(status_code=400, detail="Tie games not supported")
        
        # Validate winner
        if winner_team_id not in [match.team1_id, match.team2_id]:
            raise HTTPException(status_code=400, detail="Invalid winner team")
        
        # Update match
        match.status = MatchStatus.COMPLETED
        match.team1_score = team1_score
        match.team2_score = team2_score
        match.winner_team_id = winner_team_id
        match.played_at = datetime.utcnow()
        match.updated_at = datetime.utcnow()
        
        # Update team statistics
        if winner_team_id == match.team1_id:
            match.team1.wins += 1
            match.team2.losses += 1
        else:
            match.team2.wins += 1
            match.team1.losses += 1
        
        match.team1.total_matches += 1
        match.team2.total_matches += 1
        
        # Recalculate team chemistry based on match performance
        await update_team_chemistry(match, db)
        
        db.commit()
        
        logger.info(f"Match completed: {match_id} - Winner: {winner_team_id}")
        return BaseResponse(message="Match completed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete match"
        )

async def update_team_chemistry(match: Match, db: Session):
    """
    Update team chemistry based on match performance
    """
    try:
        # This would involve complex chemistry calculations
        # For now, make small adjustments based on match outcome
        chemistry_adjustment = 2.0 if match.winner_team_id else -1.0
        
        # Update winning team's chemistry slightly
        winning_team = db.query(Team).filter(Team.id == match.winner_team_id).first()
        if winning_team:
            winning_team.team_chemistry = min(100.0, winning_team.team_chemistry + chemistry_adjustment)
        
        # Losing team gets slight penalty
        losing_team_id = match.team1_id if match.winner_team_id == match.team2_id else match.team2_id
        losing_team = db.query(Team).filter(Team.id == losing_team_id).first()
        if losing_team:
            losing_team.team_chemistry = max(0.0, losing_team.team_chemistry - 1.0)
        
    except Exception as e:
        logger.error(f"Error updating team chemistry: {e}")

@router.get("/{match_id}/analytics")
async def get_match_analytics(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed match analytics
    """
    try:
        match = get_match_or_404(db, match_id)
        
        # Get teams
        team1 = db.query(Team).filter(Team.id == match.team1_id).first()
        team2 = db.query(Team).filter(Team.id == match.team2_id).first()
        
        # Get draft session if exists
        draft_session = db.query(DraftSession).filter(
            DraftSession.match_id == match_id
        ).first()
        
        # Calculate analytics
        # Note: Player import moved inside to avoid circular dependency
        from ..models.models import Player
        
        analytics = {
            "match": match,
            "teams": {
                "team1": {
                    "info": team1,
                    "players": db.query(Player).filter(Player.team_id == match.team1_id).all(),
                    "avg_ovr": sum(p.ovr for p in team1.players) / len(team1.players) if team1.players else 0,
                    "team_chemistry": team1.team_chemistry
                },
                "team2": {
                    "info": team2,
                    "players": db.query(Player).filter(Player.team_id == match.team2_id).all(),
                    "avg_ovr": sum(p.ovr for p in team2.players) / len(team2.players) if team2.players else 0,
                    "team_chemistry": team2.team_chemistry
                }
            },
            "draft_session": draft_session,
            "predicted_outcome": predict_match_outcome(team1, team2),
            "key_factors": identify_key_factors(team1, team2),
            "recommendations": generate_match_recommendations(team1, team2)
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match analytics {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch match analytics"
        )

def predict_match_outcome(team1: Team, team2: Team) -> Dict[str, Any]:
    """
    Predict match outcome based on team statistics
    """
    if not team1.players or not team2.players:
        return {"winner": "undetermined", "confidence": 0, "factors": []}
    
    team1_power = sum(p.ovr for p in team1.players) / len(team1.players)
    team2_power = sum(p.ovr for p in team2.players) / len(team2.players)
    
    # Factor in team chemistry
    team1_total_power = team1_power * (team1.team_chemistry / 100)
    team2_total_power = team2_power * (team2.team_chemistry / 100)
    
    total_power = team1_total_power + team2_total_power
    team1_probability = team1_total_power / total_power if total_power > 0 else 0.5
    
    winner = "team1" if team1_probability > 0.5 else "team2"
    confidence = abs(team1_probability - 0.5) * 2  # 0 to 1 scale
    
    return {
        "winner": winner,
        "confidence": round(confidence, 3),
        "team1_probability": round(team1_probability, 3),
        "team2_probability": round(1 - team1_probability, 3),
        "team1_power": round(team1_power, 2),
        "team2_power": round(team2_power, 2)
    }

def identify_key_factors(team1: Team, team2: Team) -> List[str]:
    """Identify key factors that could determine the match outcome"""
    factors = []
    
    # Compare team chemistry
    if abs(team1.team_chemistry - team2.team_chemistry) > 20:
        better_chem = team1 if team1.team_chemistry > team2.team_chemistry else team2
        factors.append(f"{better_chem.name} has significantly better team chemistry")
    
    # Player count advantage
    if abs(len(team1.players) - len(team2.players)) > 1:
        more_players = team1 if len(team1.players) > len(team2.players) else team2
        factors.append(f"{more_players.name} has a roster size advantage")
    
    return factors

def generate_match_recommendations(team1: Team, team2: Team) -> List[str]:
    """Generate tactical recommendations for the match"""
    recommendations = []
    
    # Chemistry-based recommendations
    if team1.team_chemistry < 50:
        recommendations.append(f"{team1.name} should focus on team coordination")
    if team2.team_chemistry < 50:
        recommendations.append(f"{team2.name} should focus on team coordination")
    
    # Player-based recommendations
    team1_avg_ovr = sum(p.ovr for p in team1.players) / len(team1.players) if team1.players else 0
    team2_avg_ovr = sum(p.ovr for p in team2.players) / len(team2.players) if team2.players else 0
    
    if team1_avg_ovr < team2_avg_ovr - 10:
        recommendations.append(f"{team1.name} should play more conservatively")
    elif team2_avg_ovr < team1_avg_ovr - 10:
        recommendations.append(f"{team2.name} should play more conservatively")
    
    return recommendations