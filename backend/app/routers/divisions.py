"""
Division Management Router
Handles division-related operations, switching between MOBA and Valorant modes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Player, Team, Match, User
from ..schemas.schemas import DivisionType, BaseResponse

router = APIRouter(tags=["Divisions"])
logger = logging.getLogger(__name__)

@router.get("/types")
async def get_division_types():
    """Get available division types"""
    return {
        "divisions": [
            {"id": "moba", "name": "MOBA Division", "description": "Traditional MOBA gameplay with heroes, roles, and team composition"},
            {"id": "valorant", "name": "Valorant Division", "description": "Tactical FPS gameplay with agents, maps, and strategic coordination"}
        ]
    }

@router.get("/{division_type}/overview")
async def get_division_overview(
    division_type: DivisionType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get division overview statistics"""
    try:
        if division_type == DivisionType.MOBA:
            return get_moba_overview(db)
        elif division_type == DivisionType.VALORANT:
            return get_valorant_overview(db)
        else:
            raise HTTPException(400, "Invalid division type")
    except Exception as e:
        logger.error(f"Error fetching division overview: {e}")
        raise HTTPException(500, "Failed to fetch division overview")

def get_moba_overview(db: Session) -> Dict[str, Any]:
    """Get MOBA division statistics"""
    players = db.query(Player).filter(Player.division_preference == "moba").count()
    teams = db.query(Team).filter(Team.division_type == "moba").count()
    matches = db.query(Match).filter(Match.game_mode.in_(["competitive", "unrated"])).count()
    
    return {
        "division": "moba",
        "total_players": players,
        "total_teams": teams,
        "total_matches": matches,
        "active_players": players,  # Simplified for now
        "features": [
            "Hero-based gameplay",
            "Role-based team composition", 
            "Draft and ban phase",
            "Team chemistry system",
            "Training and improvement"
        ]
    }

def get_valorant_overview(db: Session) -> Dict[str, Any]:
    """Get Valorant division statistics"""
    players = db.query(Player).filter(Player.division_preference == "valorant").count()
    teams = db.query(Team).filter(Team.division_type == "valorant").count()
    matches = db.query(Match).filter(Match.game_mode == "competitive").count()
    
    return {
        "division": "valorant", 
        "total_players": players,
        "total_teams": teams,
        "total_matches": matches,
        "active_players": players,  # Simplified for now
        "features": [
            "Agent-based gameplay",
            "Tactical FPS mechanics",
            "Map control and strategy",
            "Agent mastery system",
            "Economic gameplay"
        ]
    }

@router.post("/switch/{player_id}")
async def switch_player_division(
    player_id: int,
    new_division: DivisionType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Switch player division preference"""
    try:
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(404, "Player not found")
        
        player.division_preference = new_division.value
        player.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Player {player.name} switched to {new_division.value} division")
        return BaseResponse(message=f"Player switched to {new_division.value} division")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error switching player division: {e}")
        raise HTTPException(500, "Failed to switch division")

from datetime import datetime