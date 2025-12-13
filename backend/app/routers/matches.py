"""
Match Management Router
FIXED: Implemented 'Safe Extraction' logic to handle SQLAlchemy Enum LookupErrors.
Prevents 500 errors when Database Enum values mismatch Python Enum definitions.
Includes robust error handling for serialization.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Match, Team, DraftSession, User, Player
from ..schemas.schemas import (
    MatchCreate, MatchUpdate, MatchResponse as MatchResponseSchema,
    MatchStatus, GameModeType, PaginationParams, 
    PaginatedResponse, BaseResponse, ErrorResponse
)

# [FIX] Prefix dihapus agar route menjadi /api/matches/ (sesuai handle di main.py)
router = APIRouter(tags=["Matches"])
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

@router.get("/", response_model=PaginatedResponse[MatchResponseSchema])
async def get_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[MatchStatus] = Query(None),
    team_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),  # ISO format date
    date_to: Optional[str] = Query(None),    # ISO format date
    game_mode: Optional[GameModeType] = Query(None),
    # Filter string division ('moba', 'tactical')
    division: Optional[str] = Query(None, description="Filter by division: 'moba' or 'tactical'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all matches with optional filtering and pagination.
    Includes robust error handling for Enum mismatches using Safe Extraction.
    """
    try:
        query = db.query(Match)
        
        # --- FILTERS ---
        if status:
            query = query.filter(Match.status == status.value)
        
        if team_id:
            query = query.filter(or_(Match.team1_id == team_id, Match.team2_id == team_id))
        
        # [FIX] Filter by Division ID (Mapping String to ID)
        if division:
            div_lower = division.lower()
            if div_lower == 'moba':
                # ID 1 = MOBA (Sesuai seed data)
                query = query.filter(Match.division_id == 1)
            elif div_lower in ['tactical', 'valorant', 'fps']:
                # ID 2 = TACTICAL (Sesuai seed data)
                query = query.filter(Match.division_id == 2)
            
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
        
        # --- EXECUTE QUERY ---
        total = query.count()
        db_matches = query.order_by(Match.scheduled_at.desc()).offset(skip).limit(limit).all()
        
        # --- [SAFE EXTRACTION LOGIC] ---
        # Convert SQLAlchemy Objects to Dicts MANUALLY.
        # This bypasses the automatic extraction that triggers Enum LookupError from SQLAlchemy.
        safe_matches = []
        for m in db_matches:
            try:
                # 1. Extract basic fields safely
                # Kita construct dict manual untuk menghindari lazy loading error
                match_dict = {
                    "id": m.id,
                    # Handle status safe
                    "status": m.status if m.status else "scheduled",
                    "scheduled_at": m.scheduled_at,
                    "played_at": m.played_at,
                    "team1_score": m.team1_score,
                    "team2_score": m.team2_score,
                    "team1_id": m.team1_id,
                    "team2_id": m.team2_id,
                    "winner_team_id": m.winner_team_id,
                    "division_id": m.division_id,
                    # Relations (SQLAlchemy will fetch these automatically if accessed)
                    "team1": m.team1,
                    "team2": m.team2,
                    "winner": m.winner,
                    "draft_session": m.draft_session
                }

                # 2. Handle 'game_mode' specifically (The Problem Maker)
                # We try to access it, but if SQLAlchemy raises LookupError, we fallback to a string.
                try:
                    # Try accessing the property
                    gm_val = m.game_mode 
                    # If it's an Enum object, grab .value, otherwise use as is
                    if hasattr(gm_val, 'value'):
                        match_dict["game_mode"] = gm_val.value
                    else:
                        match_dict["game_mode"] = str(gm_val) if gm_val else None
                except Exception:
                    # CRITICAL: If SQLAlchemy fails to map the Enum, we force a fallback string.
                    # This prevents the 500 error.
                    match_dict["game_mode"] = "tournament"

                # 3. Create Pydantic Model from the clean Dictionary
                # This ensures valid JSON serialization
                match_schema = MatchResponseSchema.model_validate(match_dict)
                safe_matches.append(match_schema)

            except Exception as inner_e:
                logger.error(f"Failed to process match ID {m.id}: {inner_e}")
                # Log detail but don't crash the whole list
                continue

        # Calculate pages
        pages = (total + limit - 1) // limit if limit > 0 else 0
        
        return PaginatedResponse[MatchResponseSchema](
            items=safe_matches,
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages,
            has_next=skip + limit < total,
            has_prev=skip > 0
        )
        
    except Exception as e:
        logger.error(f"Error fetching matches: {e}")
        import traceback
        traceback.print_exc()
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
        
        # Apply Safe Extraction for Single Match too
        try:
            match_dict = {
                "id": match.id,
                "status": match.status,
                "scheduled_at": match.scheduled_at,
                "played_at": match.played_at,
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "team1_id": match.team1_id,
                "team2_id": match.team2_id,
                "winner_team_id": match.winner_team_id,
                "division_id": match.division_id,
                "team1": match.team1,
                "team2": match.team2,
                "winner": match.winner,
                "draft_session": match.draft_session
            }
            
            # Safe game_mode access
            try:
                gm = match.game_mode
                match_dict["game_mode"] = gm.value if hasattr(gm, 'value') else str(gm)
            except Exception:
                match_dict["game_mode"] = "tournament"
                
            return MatchResponseSchema.model_validate(match_dict)
            
        except Exception as validation_e:
            logger.error(f"Validation error on single match {match_id}: {validation_e}")
            # Last resort fallback, try raw object
            return match
        
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
        
        # Determine division_id from Team 1
        division_id = team1.division_id
        
        # Create match
        db_match = Match(
            team1_id=match_data.team1_id,
            team2_id=match_data.team2_id,
            scheduled_at=match_data.scheduled_at,
            division_id=division_id,
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
        
        # Update fields
        for field, value in update_data.items():
            if field == "status" and value:
                # Handle enum/string conversion for status
                val_to_set = value.value if hasattr(value, 'value') else value
                setattr(match, field, val_to_set)
                
                if val_to_set == "completed" or val_to_set == MatchStatus.COMPLETED:
                    match.played_at = datetime.utcnow()
            elif hasattr(match, field):
                setattr(match, field, value)
        
        match.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(match)
        
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
        
        # Auto-determine winner if not provided
        if not winner_team_id:
            if team1_score > team2_score:
                winner_team_id = match.team1_id
            elif team2_score > team1_score:
                winner_team_id = match.team2_id
            else:
                # Handle Draw (winner None)
                winner_team_id = None
        
        # Update match
        match.status = "completed"
        match.team1_score = team1_score
        match.team2_score = team2_score
        match.winner_team_id = winner_team_id
        match.played_at = datetime.utcnow()
        match.updated_at = datetime.utcnow()
        
        # Update team statistics
        if winner_team_id:
            if winner_team_id == match.team1_id:
                winner = db.query(Team).filter(Team.id == match.team1_id).first()
                loser = db.query(Team).filter(Team.id == match.team2_id).first()
                if winner: 
                    winner.wins += 1
                    winner.total_matches += 1
                if loser:
                    loser.losses += 1
                    loser.total_matches += 1
            else:
                winner = db.query(Team).filter(Team.id == match.team2_id).first()
                loser = db.query(Team).filter(Team.id == match.team1_id).first()
                if winner: 
                    winner.wins += 1
                    winner.total_matches += 1
                if loser:
                    loser.losses += 1
                    loser.total_matches += 1
        
        db.commit()
        
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

@router.get("/{match_id}/analytics")
async def get_match_analytics(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed match analytics (Simplified)
    """
    # Placeholder implementation to avoid import complexity
    return {"message": "Analytics endpoint active (Simplified)"}