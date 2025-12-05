"""
Draft Router - FastAPI endpoints for draft system
Handles all draft-related API operations
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..services.draft_service import DraftService
from ..services.websocket_manager import WebSocketManager
from ..schemas.schemas import (
    DraftSessionResponse, DraftState, DraftPickRequest,
    DraftPickResponse, DraftSessionCreate
)
from ..utils.auth_utils import get_current_user, verify_websocket_token
from ..models.models import User

router = APIRouter()

# WebSocket manager instance (will be injected)
websocket_manager = WebSocketManager()

# Dependency to get DraftService with database
def get_draft_service(db: Session = Depends(get_db)):
    return DraftService(db, websocket_manager)

@router.post("/sessions", response_model=DraftSessionResponse)
async def create_draft_session(
    draft_request: DraftSessionCreate,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Create a new draft session for a match"""
    try:
        session = await draft_service.create_draft_session(draft_request.match_id)
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create draft session")

@router.get("/sessions/{session_token}", response_model=DraftState)
async def get_draft_state(
    session_token: str,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get current draft state"""
    try:
        state = draft_service.get_draft_state(session_token)
        return state
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get draft state")

@router.post("/sessions/{session_token}/pick")
async def make_pick(
    session_token: str,
    pick_request: DraftPickRequest,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Make a pick or ban in the draft"""
    try:
        # Verify user belongs to the team making the pick
        # This would involve checking the user's team against the current team
        user_team_id = current_user.team_id if hasattr(current_user, 'team_id') else None
        if not user_team_id:
            raise HTTPException(status_code=403, detail="User not assigned to a team")
        
        session = await draft_service.make_pick_or_ban(
            session_token, 
            user_team_id, 
            pick_request
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process pick")

@router.post("/sessions/{session_token}/force-complete")
async def force_complete_draft(
    session_token: str,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Force complete a draft session (admin only)"""
    try:
        # Check if user has admin privileges
        if not getattr(current_user, 'is_admin', False):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        session = await draft_service.force_complete_draft(session_token)
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to complete draft")

@router.get("/sessions/{session_token}/validate-hero/{hero_id}")
async def validate_hero_assignment(
    session_token: str,
    hero_id: int,
    role: str,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Validate if hero can be assigned to specific role"""
    try:
        from app.models.models import RoleType
        
        # Convert string role to enum
        role_enum = RoleType(role)
        
        is_valid, error_msg = draft_service.validate_hero_lane_assignment(
            hero_id, role_enum
        )
        
        return {
            "valid": is_valid,
            "message": error_msg,
            "hero_id": hero_id,
            "role": role
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to validate hero assignment")

@router.get("/sessions/{session_token}/team-strength/{team_id}")
async def get_team_strength_prediction(
    session_token: str,
    team_id: int,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get predicted team strength based on current draft"""
    try:
        # Get current draft state
        state = draft_service.get_draft_state(session_token)
        
        # Determine team lineup based on team_id
        team_assignments = {}
        if team_id == 1:
            team_assignments = state.team1_lineup
        else:
            team_assignments = state.team2_lineup
        
        # Calculate team strength
        strength = draft_service.predict_team_strength(team_id, team_assignments)
        
        return {
            "team_id": team_id,
            "predicted_strength": round(strength, 2),
            "lineup_complete": len(team_assignments) == 5,
            "assigned_roles": list(team_assignments.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate team strength")

@router.get("/sessions/{session_token}/available-heroes")
async def get_available_heroes(
    session_token: str,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get list of available heroes for selection"""
    try:
        state = draft_service.get_draft_state(session_token)
        
        # Enhance heroes with additional metadata
        enhanced_heroes = []
        for hero in state.available_heroes:
            hero_data = {
                "id": hero.id,
                "name": hero.name,
                "description": hero.description,
                "base_power": hero.base_power,
                "difficulty": hero.difficulty,
                "preferred_lanes": [lane.value for lane in hero.preferred_lanes],
                "role_specific": hero.role_specific,
                "image_url": hero.image_url
            }
            enhanced_heroes.append(hero_data)
        
        return {
            "session_token": session_token,
            "available_heroes": enhanced_heroes,
            "count": len(enhanced_heroes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get available heroes")

@router.post("/sessions/{session_token}/simulate-pick")
async def simulate_pick_effect(
    session_token: str,
    pick_request: DraftPickRequest,
    current_user = Depends(get_current_user),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Simulate the effect of a pick without making it official"""
    try:
        # Get current draft state
        state = draft_service.get_draft_state(session_token)
        
        # Validate pick feasibility
        is_available = draft_service.check_hero_availability(
            state.session.id, pick_request.hero_id
        )
        
        if not is_available:
            return {
                "feasible": False,
                "reason": "Hero not available",
                "estimated_effectiveness": 0
            }
        
        # Calculate estimated effectiveness
        user_team_id = current_user.team_id if hasattr(current_user, 'team_id') else None
        if user_team_id and pick_request.role_assigned:
            # Get player for this role (simplified)
            # In reality, this would be more complex team composition logic
            effectiveness = draft_service.calculate_player_effectiveness(
                user_team_id, pick_request.hero_id
            )
        else:
            effectiveness = 0
        
        # Predict team strength change
        team_strength_before = 0  # Would calculate current team strength
        team_strength_after = effectiveness  # Simplified calculation
        
        return {
            "feasible": True,
            "estimated_effectiveness": round(effectiveness, 2),
            "team_strength_change": round(team_strength_after - team_strength_before, 2),
            "hero_power": effectiveness,
            "risk_assessment": "low" if effectiveness > 70 else "medium" if effectiveness > 40 else "high"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to simulate pick")

@router.websocket("/sessions/{session_token}")
async def websocket_draft_endpoint(
    websocket: WebSocket, 
    session_token: str
):
    """WebSocket endpoint for real-time draft updates"""
    # Authenticate WebSocket connection
    try:
        await websocket.accept()
        user = await verify_websocket_token(websocket)
        
        # Connect to draft session
        await websocket_manager.connect_draft_session(websocket, session_token)
        
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "session_token": session_token,
            "user_id": user.id,
            "message": "Connected to draft session"
        })
        
        # Keep connection alive and handle messages
        while True:
            try:
                # Receive and process messages from client
                data = await websocket.receive_json()
                await websocket_manager.handle_draft_message(
                    websocket, session_token, data
                )
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                })
                
    except Exception as e:
        await websocket.close(code=4000, reason=str(e))
    finally:
        # Clean up connection
        await websocket_manager.disconnect_client(websocket)

@router.get("/sessions/history/{team_id}")
async def get_draft_history(
    team_id: int,
    limit: int = 10,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get draft history for a team"""
    try:
        from app.models.models import DraftSession, Match, DraftPick
        from sqlalchemy import desc
        
        # Get team's draft sessions
        sessions = db.query(DraftSession).join(Match).filter(
            (Match.team1_id == team_id) | (Match.team2_id == team_id)
        ).order_by(desc(DraftSession.started_at)).limit(limit).all()
        
        history = []
        for session in sessions:
            match = db.query(Match).filter(Match.id == session.match_id).first()
            
            # Count picks and bans
            picks = db.query(DraftPick).filter(
                DraftPick.session_id == session.id,
                DraftPick.is_ban == False
            ).count()
            
            bans = db.query(DraftPick).filter(
                DraftPick.session_id == session.id,
                DraftPick.is_ban == True
            ).count()
            
            history.append({
                "session_id": session.id,
                "match_id": session.match_id,
                "phase": session.phase,
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "picks_count": picks,
                "bans_count": bans,
                "turn_number": session.turn_number,
                "team1_name": match.team1.name if match.team1 else "Unknown",
                "team2_name": match.team2.name if match.team2 else "Unknown"
            })
        
        return {
            "team_id": team_id,
            "draft_history": history,
            "total_sessions": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get draft history")