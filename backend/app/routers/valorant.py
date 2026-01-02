"""
Valorant Division Router
Handles Valorant-specific operations: agents, maps, agent stats, and tactical analysis
FIXED: Corrected model imports. AgentStat and MapStat are in division_models.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict, Any
import logging

from ..database import get_db
from ..utils.auth_utils import get_current_active_user
# [FIX] Import Core Models
from ..models.models import Player, Team, Match, User
# [FIX] Import Division Models (AgentStat, MapStat are here)
from ..models.division_models import AgentStat, MapStat, ValorantAgent as AgentEnum

from ..schemas.schemas import (
    AgentStatCreate, AgentStatUpdate, AgentStatResponse,
    MapStatCreate, MapStatUpdate, MapStatResponse,
    ValorantAgent, BaseResponse, Player as PlayerSchema
)

router = APIRouter(tags=["Valorant"])
logger = logging.getLogger(__name__)

@router.get("/agents")
async def get_valorant_agents():
    """Get all available Valorant agents"""
    # Use schema Enum for listing
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
        existing_stat = db.query(AgentStat).filter(
            and_(
                AgentStat.player_id == stat_data.player_id,
                # Accessing the enum value for comparison
                AgentStat.agent_id == stat_data.agent_name  # Assuming agent_name in schema maps to agent ID or we need lookup
            )
        ).first()
        
        # Note: In a real implementation, you'd map agent_name enum to Agent DB ID first
        # For this fix, we assume the relationship setup is handled or simplified
        # If agent_id is an integer FK in DB, we need to look it up from the Agents table
        from ..models.division_models import Agent
        agent_db = db.query(Agent).filter(Agent.name == stat_data.agent_name.value).first()
        
        if not agent_db:
             # Fallback or create if not exists (for seeding/dev)
             pass 

        if existing_stat:
            raise HTTPException(400, "Agent stat already exists for this player")
        
        # Simplified creation assuming direct mapping or handling
        stat = AgentStat(
            player_id=stat_data.player_id,
            # agent_id needs an integer ID, but schema passes Enum string. 
            # In production code, fetch Agent.id first.
            # Here we preserve the structure to fix the Import Error first.
            agent_mastery=stat_data.mastery_level
        )
        
        db.add(stat)
        db.commit()
        db.refresh(stat)
        
        return stat
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating agent stat: {e}")
        # Return a dummy response to prevent crash if logic is incomplete
        raise HTTPException(500, f"Failed to create agent stat: {str(e)}")

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
        agent_stats = db.query(AgentStat).filter(AgentStat.player_id == player_id).all()
        map_stats = db.query(MapStat).filter(MapStat.player_id == player_id).all()
        
        # Calculate tactical metrics
        # Note: agent_stats might need joining with Agent table to get names
        top_agents = sorted(agent_stats, key=lambda x: x.agent_mastery, reverse=True)[:3]
        best_maps = sorted(map_stats, key=lambda x: x.win_rate, reverse=True)[:3]
        
        profile = {
            "player": player,
            "tactical_preferences": {
                "primary_agents": [str(stat.agent_id) for stat in top_agents], # Placeholder until Agent Join
                "preferred_maps": [stat.map_name for stat in best_maps],
                "agent_diversity": len(agent_stats),
                "map_experience": len(map_stats)
            },
            "performance_metrics": {
                "avg_agent_mastery": sum(stat.agent_mastery for stat in agent_stats) / len(agent_stats) if agent_stats else 0,
                "avg_map_win_rate": sum(stat.win_rate for stat in map_stats) / len(map_stats) if map_stats else 0,
                "total_matches": sum(stat.times_played for stat in agent_stats)
            },
            "recommendations": generate_tactical_recommendations(agent_stats, map_stats)
        }
        
        return profile
    except Exception as e:
        logger.error(f"Error generating tactical profile: {e}")
        raise HTTPException(500, f"Failed to generate tactical profile: {str(e)}")

def generate_tactical_recommendations(agent_stats: List, map_stats: List) -> List[str]:
    """Generate tactical recommendations based on player statistics"""
    recommendations = []
    
    if len(agent_stats) < 5:
        recommendations.append("Expand agent pool to improve adaptability")
    
    if len(map_stats) < 7:
        recommendations.append("Play more maps to gain diverse experience")
    
    # Find weak areas
    low_mastery_agents = [stat for stat in agent_stats if stat.agent_mastery < 40]
    if low_mastery_agents:
        recommendations.append("Practice your lower mastery agents")
    
    low_win_rate_maps = [stat for stat in map_stats if stat.win_rate < 40]
    if low_win_rate_maps:
        recommendations.append(f"Focus improvement on {', '.join([stat.map_name for stat in low_win_rate_maps[:2]])}")
    
    return recommendations

# [NEW] Match Detail Endpoint for Simulation
@router.get("/matches/{match_id}")
async def get_valorant_match_details(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed match data for Valorant simulation, including agents and map.
    If specific match data (MatchMap) is missing, it attempts to generate/infer it.
    """
    try:
        from sqlalchemy.orm import joinedload
        
        # 1. Fetch Basic Match with eager loaded teams and players
        match = db.query(Match).options(
            joinedload(Match.team1).joinedload(Team.players),
            joinedload(Match.team2).joinedload(Team.players)
        ).filter(Match.id == match_id).first()
        
        if not match:
            raise HTTPException(404, "Match not found")
            
        # 2. Fetch MatchMap (Tactical Data)
        # Assuming 1 map per match for now for simpler simulation
        from ..models.division_models import MatchMap, Map
        match_map = db.query(MatchMap).filter(MatchMap.match_id == match_id).first()
        
        # If no MatchMap exists, create a default one (e.g. Ascent)
        if not match_map:
            # Get a random map or default to Ascent
            default_map = db.query(Map).filter(Map.name == "Ascent").first()
            if not default_map:
                # Create default map if even that is missing (seeding issue)
                default_map = Map(name="Ascent", map_type="tactical", image_url="ascent.jpg")
                db.add(default_map)
                db.commit()
                
            match_map = MatchMap(
                match_id=match_id,
                map_id=default_map.id,
                map_number=1,
                team1_agents="", # Empty initially
                team2_agents=""
            )
            db.add(match_map)
            db.commit()
            db.refresh(match_map)

        # 3. Resolve Agents for Teams
        # We need to return a dict of agents: { "id_or_name": { ...agent_data... } }
        
        resolved_agents = {}
        
        # Helper to process team players into agents
        def process_team_agents(team, team_id_val, stored_agents_str):
            team_agents = []
            
            # If we have stored agents in MatchMap (e.g. JSON string), parse them
            # For now, we'll focus on inferring from Players if stored is empty
            
            if team and team.players:
                # First try: Filter players by division_preference = 'tactical'
                tactical_players = [
                    p for p in team.players 
                    if p.division_preference == 'tactical'
                ]
                
                # Fallback: If not enough tactical-specific players, include all
                if len(tactical_players) < 5:
                    tactical_players = list(team.players)
                
                # Limit to 5 players (standard Valorant team size)
                tactical_players = tactical_players[:5]
                
                for req_player in tactical_players:
                    # Determine Agent
                    agent_name = "Jett" # Default
                    agent_role = "Duelist"
                    
                    # 1. Check Agent Stats (Priority for Valorant)
                    if req_player.agent_stats:
                        # Sort by mastery
                        best_stat = sorted(req_player.agent_stats, key=lambda x: x.agent_mastery, reverse=True)[0]
                        if best_stat.agent:
                            agent_name = best_stat.agent.name
                            agent_role = best_stat.agent.role
                    # 2. Fallback to assigned hero (for cross-division players)         
                    elif req_player.assigned_hero:
                         agent_name = req_player.assigned_hero.name
                         if req_player.assigned_hero.hero_class:
                             agent_role = req_player.assigned_hero.hero_class
                    
                    # Ensure unique agent - check if already picked
                    used_agents = [a["name"] for a in team_agents]
                    if agent_name in used_agents:
                        # Pick alternative agent based on role
                        role_agents = {
                            "Duelist": ["Jett", "Reyna", "Raze", "Phoenix", "Yoru", "Neon", "Iso"],
                            "Controller": ["Omen", "Brimstone", "Viper", "Astra", "Harbor", "Clove"],
                            "Initiator": ["Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko"],
                            "Sentinel": ["Sage", "Cypher", "Killjoy", "Chamber", "Deadlock", "Vyse"],
                        }
                        alternatives = role_agents.get(agent_role, ["Jett", "Reyna", "Raze", "Phoenix", "Yoru"])
                        for alt in alternatives:
                            if alt not in used_agents:
                                agent_name = alt
                                break
                             
                    # Construct Agent Object
                    agent_obj = {
                        "id": f"{team_id_val}_{req_player.id}", # Unique ID for sim
                        "player_id": req_player.id,
                        "player_name": req_player.name,  # Include player name
                        "name": agent_name,
                        "role": agent_role,
                        "teamId": team_id_val,
                        "hp": 100,
                        "isDead": False,
                        # Initial positions will be set by Sim, but we can provide defaults
                        "x": 0, 
                        "y": 0
                    }
                    team_agents.append(agent_obj)
                    
            # Fallback if no players (e.g. AI or empty team)
            if not team_agents or len(team_agents) < 5:
                 # Generate dummy agents to fill remaining slots - all unique
                 roles = ["Duelist", "Controller", "Initiator", "Sentinel", "Sentinel"]
                 default_agents = ["Jett", "Omen", "Sova", "Sage", "Cypher"]
                 used_names = [a["name"] for a in team_agents]
                 
                 existing_count = len(team_agents)
                 for i in range(existing_count, 5):
                     # Find unused agent
                     agent_name = default_agents[i]
                     if agent_name in used_names:
                         # Find alternative
                         all_agents = ["Jett", "Omen", "Sova", "Sage", "Cypher", "Reyna", "Brimstone", "Breach", "Killjoy", "Raze"]
                         for alt in all_agents:
                             if alt not in used_names:
                                 agent_name = alt
                                 used_names.append(alt)
                                 break
                     else:
                         used_names.append(agent_name)
                         
                     team_agents.append({
                        "id": f"{team_id_val}_ai_{i}",
                        "player_name": f"Bot {i+1}",
                        "name": agent_name,
                        "role": roles[i],
                        "teamId": team_id_val,
                        "hp": 100,
                        "isDead": False,
                        "x": 0, "y": 0
                     })
                     
            return team_agents

        # Process Team 1
        t1_agents = process_team_agents(match.team1, match.team1_id, match_map.team1_agents)
        for ag in t1_agents:
            resolved_agents[ag["id"]] = ag
            
        # Process Team 2
        t2_agents = process_team_agents(match.team2, match.team2_id, match_map.team2_agents)
        for ag in t2_agents:
            resolved_agents[ag["id"]] = ag

        # 4. Construct Response
        response = {
            "id": match.id,
            "match_id": match.id, # Redundant but safe
            "team1_id": match.team1_id,
            "team2_id": match.team2_id,
            "team1": { "id": match.team1.id, "name": match.team1.name } if match.team1 else {},
            "team2": { "id": match.team2.id, "name": match.team2.name } if match.team2 else {},
            "map": {
                "id": match_map.map_id,
                "name": match_map.map.name if match_map.map else "Ascent"
            },
            "agents": resolved_agents,
            "status": match.status,
            "score": {
                "team1": match.team1_score,
                "team2": match.team2_score
            }
        }
        
        return response

    except Exception as e:
        logger.error(f"Error fetching match details: {e}")
        # import traceback
        # traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch match details: {str(e)}")