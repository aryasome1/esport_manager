"""
Valorant Division Router
Handles Valorant-specific operations: agents, maps, agent stats, and tactical analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
from ..models.models import Player, Team, Match, User
from ..schemas.schemas import (
    AgentStatCreate, AgentStatUpdate, AgentStatResponse,
    MapStatCreate, MapStatUpdate, MapStatResponse,
    ValorantAgent, GameMode, BaseResponse, Player as PlayerSchema
)

router = APIRouter(prefix="/valorant", tags=["Valorant"])
logger = logging.getLogger(__name__)

@router.get("/agents")
async def get_valorant_agents():
    """Get all available Valorant agents"""
    agents = [
        {"name": agent.value, "display_name": agent.name.replace("_", " ")}
        for agent in ValorantAgent
    ]
    return {"agents": agents}

@router.post("/agent-stats", response_model=AgentStatResponse)
async def create_agent_stat(
    stat_data: AgentStatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create agent statistics for player"""
    try:
        player = db.query(Player).filter(Player.id == stat_data.player_id).first()
        if not player:
            raise HTTPException(404, "Player not found")
        
        # Check if stat already exists
        from ..models.models import AgentStat
        existing_stat = db.query(AgentStat).filter(
            and_(
                AgentStat.player_id == stat_data.player_id,
                AgentStat.agent_name == stat_data.agent_name.value
            )
        ).first()
        
        if existing_stat:
            raise HTTPException(400, "Agent stat already exists for this player")
        
        stat = AgentStat(
            player_id=stat_data.player_id,
            agent_name=stat_data.agent_name.value,
            mastery_level=stat_data.mastery_level
        )
        
        db.add(stat)
        db.commit()
        db.refresh(stat)
        
        return stat
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating agent stat: {e}")
        raise HTTPException(500, "Failed to create agent stat")

@router.post("/map-stats", response_model=MapStatResponse)
async def create_map_stat(
    stat_data: MapStatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create map statistics for player"""
    try:
        player = db.query(Player).filter(Player.id == stat_data.player_id).first()
        if not player:
            raise HTTPException(404, "Player not found")
        
        # Check if stat already exists
        from ..models.models import MapStat
        existing_stat = db.query(MapStat).filter(
            and_(
                MapStat.player_id == stat_data.player_id,
                MapStat.map_name == stat_data.map_name
            )
        ).first()
        
        if existing_stat:
            raise HTTPException(400, "Map stat already exists for this player")
        
        stat = MapStat(
            player_id=stat_data.player_id,
            map_name=stat_data.map_name,
            win_rate=stat_data.win_rate,
            times_played=stat_data.times_played
        )
        
        db.add(stat)
        db.commit()
        db.refresh(stat)
        
        return stat
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating map stat: {e}")
        raise HTTPException(500, "Failed to create map stat")

@router.get("/maps")
async def get_valorant_maps():
    """Get available Valorant maps"""
    maps = [
        "Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", 
        "Fracture", "Pearl", "Lotus", "Sunset"
    ]
    return {"maps": maps}

@router.get("/player/{player_id}/tactical-profile")
async def get_player_tactical_profile(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get player's tactical profile for Valorant division"""
    try:
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(404, "Player not found")
        
        # Get agent stats
        from ..models.models import AgentStat, MapStat
        agent_stats = db.query(AgentStat).filter(AgentStat.player_id == player_id).all()
        map_stats = db.query(MapStat).filter(MapStat.player_id == player_id).all()
        
        # Calculate tactical metrics
        top_agents = sorted(agent_stats, key=lambda x: x.mastery_level, reverse=True)[:3]
        best_maps = sorted(map_stats, key=lambda x: x.win_rate, reverse=True)[:3]
        
        profile = {
            "player": player,
            "tactical_preferences": {
                "primary_agents": [stat.agent_name for stat in top_agents],
                "preferred_maps": [stat.map_name for stat in best_maps],
                "agent_diversity": len(agent_stats),
                "map_experience": len(map_stats)
            },
            "performance_metrics": {
                "avg_agent_mastery": sum(stat.mastery_level for stat in agent_stats) / len(agent_stats) if agent_stats else 0,
                "avg_map_win_rate": sum(stat.win_rate for stat in map_stats) / len(map_stats) if map_stats else 0,
                "total_matches": sum(stat.times_played for stat in agent_stats)
            },
            "recommendations": generate_tactical_recommendations(agent_stats, map_stats)
        }
        
        return profile
    except Exception as e:
        logger.error(f"Error generating tactical profile: {e}")
        raise HTTPException(500, "Failed to generate tactical profile")

def generate_tactical_recommendations(agent_stats: List, map_stats: List) -> List[str]:
    """Generate tactical recommendations based on player statistics"""
    recommendations = []
    
    if len(agent_stats) < 5:
        recommendations.append("Expand agent pool to improve adaptability")
    
    if len(map_stats) < 7:
        recommendations.append("Play more maps to gain diverse experience")
    
    # Find weak areas
    low_mastery_agents = [stat for stat in agent_stats if stat.mastery_level < 40]
    if low_mastery_agents:
        recommendations.append(f"Practice {', '.join([stat.agent_name for stat in low_mastery_agents[:2]])}")
    
    low_win_rate_maps = [stat for stat in map_stats if stat.win_rate < 40]
    if low_win_rate_maps:
        recommendations.append(f"Focus improvement on {', '.join([stat.map_name for stat in low_win_rate_maps[:2]])}")
    
    return recommendations

from sqlalchemy import and_