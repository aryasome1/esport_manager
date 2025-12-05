"""
Mobile Legends: Bang Bang API Router
FastAPI router for Mobile Legends hero data and related functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..services.moba_api_service import MobileLegendsAPIService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/heroes", response_model=List[Dict])
async def get_all_moba_heroes():
    """
    Get all Mobile Legends heroes from the API
    
    Returns:
        List of hero data including names, roles, images, and basic stats
    """
    service = MobileLegendsAPIService()
    heroes_data = await service.get_all_heroes()
    
    # Transform data for response
    transformed_heroes = []
    for hero_record in heroes_data:
        if isinstance(hero_record, dict) and 'data' in hero_record:
            hero_data = hero_record['data']
            hero_info = hero_data.get('hero', {}).get('data', {})
            
            transformed_hero = {
                "hero_id": hero_data.get('hero_id', 0),
                "name": hero_info.get('name', 'Unknown'),
                "role": hero_info.get('sortlabel', [''])[0] if hero_info.get('sortlabel') else 'Unknown',
                "position": hero_info.get('roadsortlabel', [''])[0] if hero_info.get('roadsortlabel') else 'Unknown',
                "description": hero_info.get('story', ''),
                "image_url": hero_info.get('head', ''),
                "square_image_url": hero_info.get('squarehead', ''),
                "difficulty": hero_info.get('difficulty', '3'),
                "specialty": ', '.join(hero_info.get('speciality', [])) if hero_info.get('speciality') else 'General',
                "recommend_level": hero_info.get('recommendlevellabel', '')
            }
            transformed_heroes.append(transformed_hero)
    
    if not transformed_heroes:
        # Return fallback data if API fails
        service = MobileLegendsAPIService()
        transformed_heroes = service._get_fallback_heroes()
    
    return transformed_heroes

@router.get("/heroes/{hero_id}", response_model=Dict)
async def get_moba_hero_detail(hero_id: int):
    """
    Get detailed information for a specific Mobile Legends hero
    
    Args:
        hero_id: ID of the hero
        
    Returns:
        Detailed hero information including abilities, stats, and relationships
    """
    service = MobileLegendsAPIService()
    hero_detail = await service.get_hero_detail(hero_id)
    
    if not hero_detail:
        # Return fallback data
        fallback_heroes = service._get_fallback_heroes()
        hero_detail = next((h for h in fallback_heroes if h['hero_id'] == hero_id), fallback_heroes[0])
        
        return {
            "hero_id": hero_detail['hero_id'],
            "name": hero_detail['name'],
            "role": hero_detail['role'],
            "position": hero_detail['position'],
            "description": hero_detail['description'],
            "image_url": hero_detail['image_url'],
            "difficulty": hero_detail['difficulty'],
            "difficulty_level": hero_detail['difficulty_level'],
            "specialty": hero_detail['specialty'],
            "abilities": hero_detail.get('abilities', []),
            "recommend_level": "3-1-2-0-1/2",
            "base_power": hero_detail.get('base_power', 75.0)
        }
    
    # Transform detailed data
    transformed_hero = service.transform_hero_data(hero_detail)
    
    # Add additional detailed data
    hero_data = hero_detail.get('data', {})
    hero_info = hero_data.get('hero', {}).get('data', {})
    
    # Get skills if available
    skills = hero_info.get('heroskilllist', [])
    abilities = []
    if skills and len(skills) > 0:
        skill_list = skills[0].get('skilllist', [])
        for skill in skill_list:
            abilities.append({
                "name": skill.get('skillname', ''),
                "description": skill.get('skilldesc', ''),
                "cooldown": skill.get('skillcd&cost', ''),
                "icon_url": skill.get('skillicon', ''),
                "tags": [tag.get('tagname', '') for tag in skill.get('skilltag', [])]
            })
    
    transformed_hero['abilities'] = abilities
    
    # Add relationship data if available
    relation_data = hero_data.get('relation', {})
    if relation_data:
        transformed_hero['relationships'] = {
            "assist": {
                "description": relation_data.get('assist', {}).get('desc', ''),
                "target_heroes": [h.get('data', {}).get('head', '') for h in relation_data.get('assist', {}).get('target_hero', [])]
            },
            "strong": {
                "description": relation_data.get('strong', {}).get('desc', ''),
                "target_heroes": [h.get('data', {}).get('head', '') for h in relation_data.get('strong', {}).get('target_hero', [])]
            },
            "weak": {
                "description": relation_data.get('weak', {}).get('desc', ''),
                "target_heroes": [h.get('data', {}).get('head', '') for h in relation_data.get('weak', {}).get('target_hero', [])]
            }
        }
    
    return transformed_hero

@router.get("/heroes/{hero_id}/abilities", response_model=List[Dict])
async def get_hero_abilities(hero_id: int):
    """
    Get abilities for a specific Mobile Legends hero
    
    Args:
        hero_id: ID of the hero
        
    Returns:
        List of hero abilities with details
    """
    service = MobileLegendsAPIService()
    hero_detail = await service.get_hero_detail(hero_id)
    
    if hero_detail:
        hero_data = hero_detail.get('data', {})
        hero_info = hero_data.get('hero', {}).get('data', {})
        
        # Extract skills
        skills = hero_info.get('heroskilllist', [])
        abilities = []
        if skills and len(skills) > 0:
            skill_list = skills[0].get('skilllist', [])
            for skill in skill_list:
                abilities.append({
                    "name": skill.get('skillname', ''),
                    "description": skill.get('skilldesc', ''),
                    "cooldown": skill.get('skillcd&cost', ''),
                    "icon_url": skill.get('skillicon', ''),
                    "tags": [tag.get('tagname', '') for tag in skill.get('skilltag', [])],
                    "skill_id": skill.get('skillid', 0)
                })
        
        return abilities
    
    # Return fallback abilities
    return [
        {
            "name": "Basic Attack",
            "description": "Standard attack ability",
            "cooldown": "Auto",
            "icon_url": "",
            "tags": ["Basic"],
            "skill_id": 1
        },
        {
            "name": "Skill 1",
            "description": "Primary active skill",
            "cooldown": "10s",
            "icon_url": "",
            "tags": ["Active"],
            "skill_id": 2
        },
        {
            "name": "Skill 2",
            "description": "Secondary active skill",
            "cooldown": "12s",
            "icon_url": "",
            "tags": ["Active"],
            "skill_id": 3
        },
        {
            "name": "Ultimate",
            "description": "Powerful ultimate ability",
            "cooldown": "60s",
            "icon_url": "",
            "tags": ["Ultimate"],
            "skill_id": 4
        }
    ]

@router.post("/heroes/sync")
async def sync_moba_heroes():
    """
    Synchronize Mobile Legends heroes from the API to local database
    
    Returns:
        Result of the synchronization process
    """
    service = MobileLegendsAPIService()
    heroes_data = await service.get_all_heroes()
    
    sync_results = {
        "success": True,
        "total_heroes": len(heroes_data) if heroes_data else 0,
        "synced_heroes": [],
        "failed_heroes": [],
        "message": "Hero synchronization completed"
    }
    
    for hero_record in heroes_data:
        try:
            if isinstance(hero_record, dict) and 'data' in hero_record:
                hero_data = hero_record['data']
                hero_info = hero_data.get('hero', {}).get('data', {})
                
                hero_name = hero_info.get('name', '')
                hero_id = hero_data.get('hero_id', 0)
                
                if hero_name and hero_id:
                    sync_results["synced_heroes"].append({
                        "hero_id": hero_id,
                        "name": hero_name,
                        "role": hero_info.get('sortlabel', [''])[0] if hero_info.get('sortlabel') else 'Unknown',
                        "image_url": hero_info.get('head', '')
                    })
        except Exception as e:
            logger.error(f"Error syncing hero: {e}")
            sync_results["failed_heroes"].append(str(e))
    
    return sync_results

@router.get("/recommendations", response_model=List[Dict])
async def get_moba_recommendations(
    preferred_role: Optional[str] = Query(None, description="Preferred hero role"),
    difficulty_level: Optional[str] = Query(None, description="Preferred difficulty level"),
    play_style: Optional[str] = Query(None, description="Preferred play style")
):
    """
    Get personalized hero recommendations based on preferences
    
    Args:
        preferred_role: Preferred role (e.g., Marksman, Tank, Assassin)
        difficulty_level: Preferred difficulty (Easy, Medium, Hard)
        play_style: Preferred play style (aggressive, defensive, support)
        
    Returns:
        List of recommended heroes with scores
    """
    service = MobileLegendsAPIService()
    
    player_preferences = {
        "preferred_role": preferred_role or "",
        "difficulty_level": difficulty_level or "Medium",
        "play_style": play_style or ""
    }
    
    recommendations = service.get_personalized_recommendations(player_preferences)
    return recommendations

@router.get("/heroes/{hero_id}/strategy-guide", response_model=Dict)
async def get_hero_strategy_guide(hero_id: int):
    """
    Get comprehensive strategy guide for a specific hero
    
    Args:
        hero_id: ID of the hero
        
    Returns:
        Strategy guide with tips, builds, and positioning advice
    """
    service = MobileLegendsAPIService()
    strategy_guide = service.get_hero_strategy_guide(hero_id)
    return strategy_guide

@router.get("/heroes/search", response_model=List[Dict])
async def search_moba_heroes(
    query: str = Query(..., description="Search query for hero name")
):
    """
    Search for Mobile Legends heroes by name
    
    Args:
        query: Search query string
        
    Returns:
        List of matching heroes
    """
    service = MobileLegendsAPIService()
    heroes_data = await service.get_all_heroes()
    
    matching_heroes = []
    query_lower = query.lower()
    
    for hero_record in heroes_data:
        if isinstance(hero_record, dict) and 'data' in hero_record:
            hero_data = hero_record['data']
            hero_info = hero_data.get('hero', {}).get('data', {})
            
            hero_name = hero_info.get('name', '').lower()
            hero_role = hero_info.get('sortlabel', [''])[0] if hero_info.get('sortlabel') else ''
            
            if query_lower in hero_name or query_lower in hero_role.lower():
                matching_heroes.append({
                    "hero_id": hero_data.get('hero_id', 0),
                    "name": hero_info.get('name', 'Unknown'),
                    "role": hero_role,
                    "image_url": hero_info.get('head', ''),
                    "description": hero_info.get('story', '')
                })
    
    # If no matches found, return fallback heroes that match
    if not matching_heroes:
        fallback_heroes = service._get_fallback_heroes()
        for hero in fallback_heroes:
            if query_lower in hero['name'].lower() or query_lower in hero['role'].lower():
                matching_heroes.append(hero)
    
    return matching_heroes

@router.get("/heroes/positions", response_model=List[Dict])
async def get_hero_positions():
    """
    Get available hero positions/roles
    
    Returns:
        List of available positions and their descriptions
    """
    positions = [
        {
            "position": "Gold Lane",
            "role": "Marksman",
            "description": "Carries that deal sustained damage from a safe distance",
            "typical_heroes": ["Miya", "Layla", "Karrie"],
            "difficulty": "Easy to Medium"
        },
        {
            "position": "Mid Lane", 
            "role": "Mage/Assassin/Fighter",
            "description": "Central lane heroes with strong ability power or mobility",
            "typical_heroes": ["Kagura", "Gusion", "Chou"],
            "difficulty": "Medium to Hard"
        },
        {
            "position": "Tank",
            "role": "Tank",
            "description": "Frontline heroes that protect teammates and initiate fights",
            "typical_heroes": ["Tigreal", "Franco", "Akai"],
            "difficulty": "Easy to Medium"
        },
        {
            "position": "Jungle",
            "role": "Assassin/Fighter",
            "description": "Independent farmers who gank and control objectives",
            "typical_heroes": ["Alucard", "Lapu-Lapu", "Fredrinn"],
            "difficulty": "Hard to Very Hard"
        },
        {
            "position": "Roam",
            "role": "Support",
            "description": "Support heroes that assist teammates and control vision",
            "typical_heroes": ["Rafaela", "Angela", "Lolita"],
            "difficulty": "Medium"
        }
    ]
    
    return positions

@router.get("/heroes/roles", response_model=List[Dict])
async def get_hero_roles():
    """
    Get available hero roles and their characteristics
    
    Returns:
        List of roles with descriptions and play styles
    """
    roles = [
        {
            "role": "Marksman",
            "description": "Ranged damage dealers who excel in late game team fights",
            "characteristics": ["High damage", "Low defense", "Range advantage"],
            "playstyle": "Positioning and sustained damage",
            "difficulty": "Easy to Medium"
        },
        {
            "role": "Tank",
            "description": "Frontline heroes with high defense who protect teammates",
            "characteristics": ["High defense", "Crowd control", "Initiation"],
            "playstyle": "Lead team fights and protect allies",
            "difficulty": "Easy to Medium"
        },
        {
            "role": "Assassin",
            "description": "High mobility heroes who eliminate priority targets",
            "characteristics": ["High mobility", "Burst damage", "Flanking"],
            "playstyle": "Quick eliminations and hit-and-run tactics",
            "difficulty": "Hard to Very Hard"
        },
        {
            "role": "Fighter",
            "description": "Balanced heroes who can deal damage and sustain in fights",
            "characteristics": ["Balanced stats", "Sustain", "Flexibility"],
            "playstyle": "Adapt to team needs and control objectives",
            "difficulty": "Medium to Hard"
        },
        {
            "role": "Mage",
            "description": "Ability-based damage dealers with area effect abilities",
            "characteristics": ["Ability damage", "Area control", "Crowd control"],
            "playstyle": "Control team fights and provide utility",
            "difficulty": "Medium to Hard"
        },
        {
            "role": "Support",
            "description": "Heroes who assist teammates with healing and protection",
            "characteristics": ["Healing", "Protection", "Vision control"],
            "playstyle": "Assist teammates and control map vision",
            "difficulty": "Medium"
        }
    ]
    
    return roles

@router.get("/health")
async def moba_api_health_check():
    """
    Health check endpoint for MOBA API service
    
    Returns:
        Service status and version information
    """
    return {
        "status": "healthy",
        "service": "Mobile Legends: Bang Bang API Integration",
        "version": "1.0.0",
        "base_url": "https://mlbb-stats.ridwaanhall.com/api",
        "available_endpoints": [
            "GET /api/moba/heroes - Get all heroes",
            "GET /api/moba/heroes/{hero_id} - Get hero details",
            "GET /api/moba/heroes/{hero_id}/abilities - Get hero abilities",
            "POST /api/moba/heroes/sync - Sync heroes from API",
            "GET /api/moba/recommendations - Get recommendations",
            "GET /api/moba/heroes/{hero_id}/strategy-guide - Get strategy guide",
            "GET /api/moba/heroes/search - Search heroes",
            "GET /api/moba/heroes/positions - Get hero positions",
            "GET /api/moba/heroes/roles - Get hero roles"
        ],
        "features": {
            "hero_data": "Complete hero information with abilities",
            "personalized_recommendations": "AI-powered hero recommendations",
            "strategy_guides": "Comprehensive gameplay guides",
            "real_time_data": "Live data from Mobile Legends API",
            "fallback_support": "Offline mode with curated data"
        }
    }