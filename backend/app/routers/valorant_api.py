"""
Valorant API Router - Exposes Grenish Valorant API integration
Provides endpoints for agent data, recommendations, and strategy guides
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import asyncio

from app.database import get_db
from app.services.valorant_service import ValorantMatchService
from app.services.valorant_api_service import ValorantAgent

router = APIRouter(tags=["valorant-api"])

@router.get("/agents", response_model=List[Dict[str, Any]])
async def get_all_agents(db: Session = Depends(get_db)):
    """Get all Valorant agents from the Grenish API"""
    try:
        valorant_service = ValorantMatchService(db)
        agents = await valorant_service.get_valorant_agents_from_api()
        
        return [
            {
                "agent_id": agent.agent_id,
                "name": agent.name,
                "role": agent.role,
                "role_icon": agent.role_icon,
                "abilities": agent.abilities,
                "origin": agent.origin,
                "release_patch": agent.release_patch,
                "profile_icon": agent.profile_icon,
                "profile_image": agent.profile_image
            }
            for agent in agents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {str(e)}")

@router.get("/agents/{agent_name}", response_model=Dict[str, Any])
async def get_agent_by_name(agent_name: str, db: Session = Depends(get_db)):
    """Get specific agent data by name"""
    try:
        valorant_service = ValorantMatchService(db)
        agent = await valorant_service.get_agent_from_api_by_name(agent_name)
        
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
        
        return {
            "agent_id": agent.agent_id,
            "name": agent.name,
            "role": agent.role,
            "role_icon": agent.role_icon,
            "abilities": agent.abilities,
            "origin": agent.origin,
            "release_patch": agent.release_patch,
            "profile_icon": agent.profile_icon,
            "profile_image": agent.profile_image
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent: {str(e)}")

@router.get("/agents/{agent_name}/abilities", response_model=List[Dict[str, Any]])
async def get_agent_abilities(agent_name: str, db: Session = Depends(get_db)):
    """Get agent's abilities"""
    try:
        valorant_service = ValorantMatchService(db)
        abilities = await valorant_service.get_agent_abilities_from_api(agent_name)
        
        if not abilities:
            raise HTTPException(status_code=404, detail=f"No abilities found for agent '{agent_name}'")
        
        return abilities
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch abilities: {str(e)}")

@router.get("/agents/{agent_name}/profile-image")
async def get_agent_profile_image(agent_name: str, db: Session = Depends(get_db)):
    """Get agent profile image URL"""
    try:
        from app.services.valorant_api_service import valorant_api_service
        image_url = await valorant_api_service.get_agent_profile_image(agent_name)
        
        if not image_url:
            raise HTTPException(status_code=404, detail=f"Profile image not found for agent '{agent_name}'")
        
        return {"agent_name": agent_name, "profile_image": image_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile image: {str(e)}")

@router.get("/agents/{agent_name}/profile-icon")
async def get_agent_profile_icon(agent_name: str, db: Session = Depends(get_db)):
    """Get agent profile icon URL"""
    try:
        from app.services.valorant_api_service import valorant_api_service
        icon_url = await valorant_api_service.get_agent_profile_icon(agent_name)
        
        if not icon_url:
            raise HTTPException(status_code=404, detail=f"Profile icon not found for agent '{agent_name}'")
        
        return {"agent_name": agent_name, "profile_icon": icon_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile icon: {str(e)}")

@router.post("/agents/sync", response_model=Dict[str, Any])
async def sync_agents_from_api(db: Session = Depends(get_db)):
    """Sync agents from Grenish API to local database"""
    try:
        valorant_service = ValorantMatchService(db)
        synced_agents = await valorant_service.sync_agents_from_api()
        
        return {
            "message": f"Successfully synced {len(synced_agents)} agents",
            "synced_count": len(synced_agents),
            "agents": [
                {
                    "id": agent.id,
                    "name": agent.name,
                    "role": agent.role,
                    "synced": True
                }
                for agent in synced_agents
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync agents: {str(e)}")

@router.get("/recommendations", response_model=List[Dict[str, Any]])
async def get_agent_recommendations(
    player_id: int = Query(..., description="Player ID to get recommendations for"),
    preferred_role: Optional[str] = Query(None, description="Preferred agent role"),
    map_name: Optional[str] = Query(None, description="Map name for synergy calculation"),
    db: Session = Depends(get_db)
):
    """Get personalized agent recommendations"""
    try:
        valorant_service = ValorantMatchService(db)
        recommendations = await valorant_service.get_agent_recommendations_from_api(
            player_id=player_id,
            preferred_role=preferred_role,
            map_name=map_name
        )
        
        return [
            {
                "agent": {
                    "agent_id": rec["agent"].agent_id,
                    "name": rec["agent"].name,
                    "role": rec["agent"].role,
                    "role_icon": rec["agent"].role_icon,
                    "profile_icon": rec["agent"].profile_icon,
                    "profile_image": rec["agent"].profile_image
                },
                "score": rec["score"],
                "recommendation_reason": rec["recommendation_reason"]
            }
            for rec in recommendations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/agents/{agent_name}/strategy-guide", response_model=Dict[str, Any])
async def get_agent_strategy_guide(
    agent_name: str, 
    db: Session = Depends(get_db)
):
    """Get comprehensive strategy guide for an agent"""
    try:
        valorant_service = ValorantMatchService(db)
        guide = await valorant_service.get_agent_strategy_guide(agent_name)
        
        if not guide:
            raise HTTPException(status_code=404, detail=f"Strategy guide not found for agent '{agent_name}'")
        
        return guide
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get strategy guide: {str(e)}")

@router.get("/agents/role/{role}", response_model=List[Dict[str, Any]])
async def get_agents_by_role(
    role: str, 
    db: Session = Depends(get_db)
):
    """Get agents filtered by role"""
    try:
        from app.services.valorant_api_service import valorant_api_service
        agents = await valorant_api_service.get_agents_by_role(role)
        
        return [
            {
                "agent_id": agent.agent_id,
                "name": agent.name,
                "role": agent.role,
                "role_icon": agent.role_icon,
                "profile_icon": agent.profile_icon,
                "profile_image": agent.profile_image
            }
            for agent in agents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents by role: {str(e)}")

@router.get("/agents/search", response_model=List[Dict[str, Any]])
async def search_agents(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """Search agents by name or ability description"""
    try:
        from app.services.valorant_api_service import valorant_api_service
        agents = await valorant_api_service.search_agents(q)
        
        return [
            {
                "agent_id": agent.agent_id,
                "name": agent.name,
                "role": agent.role,
                "role_icon": agent.role_icon,
                "abilities": agent.abilities,
                "profile_icon": agent.profile_icon,
                "profile_image": agent.profile_image
            }
            for agent in agents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search agents: {str(e)}")

@router.get("/health", response_model=Dict[str, str])
async def api_health():
    """Health check for Valorant API service"""
    return {
        "status": "healthy",
        "service": "Valorant API Integration",
        "version": "1.0.0"
    }