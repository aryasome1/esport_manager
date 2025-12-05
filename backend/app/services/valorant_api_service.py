"""
Valorant API Service - Integration with Grenish Valorant API
Provides access to Valorant agent data, abilities, and game information
"""

import httpx
import asyncio
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValorantAgent:
    """Valorant Agent data model"""
    agent_id: int
    name: str
    role: str
    role_icon: str
    abilities: List[Dict[str, Any]]
    origin: str
    release_patch: str
    profile_icon: Optional[str] = None
    profile_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    story: Optional[Dict[str, Any]] = None

class ValorantAPIService:
    """
    Service for interacting with the Grenish Valorant API
    
    API Base URL: TBA (To Be Announced) - Using alternative endpoints for now
    Endpoints available:
    - GET /api/agents - Get all agents
    - GET /api/agents/:name - Get agent by name
    - GET /api/agent/id/:id - Get agent by ID
    - GET /api/agents/:name/profile-image - Get agent profile image
    - GET /api/agents/:name/profile-icon - Get agent profile icon
    """
    
    def __init__(self):
        # Note: The original API base URL is TBA, so we'll use alternative sources
        # For now, we'll implement a fallback with hardcoded data
        self.base_urls = [
            "https://valorant-api.com/v1",  # Alternative public API
            # "TBA - Main API endpoint",  # Placeholder for when API is ready
        ]
        self.fallback_agents = self._get_fallback_agent_data()
    
    def _get_fallback_agent_data(self) -> List[Dict[str, Any]]:
        """Provide fallback agent data when API is unavailable"""
        return [
            {
                "agent_id": 1,
                "name": "Brimstone",
                "role": "Controller",
                "role_icon": "https://static.wikia.nocookie.net/valorant/images/a/ab/Brimstone_Splash_Art.png",
                "abilities": [
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/3/3b/Incendiary.png",
                        "name": "Incendiary",
                        "description": "Launch a grenade that deploys a damaging field of fire.",
                        "category": "Basic",
                        "price": 250
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/3/3b/Skye_Seeker_Bolt.png",
                        "name": "Stim Beacon",
                        "description": "Throw a stim beacon that grants RapidFire to all players.",
                        "category": "Signature",
                        "price": 0
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/e/ed/Tactical_Molotov.png",
                        "name": "Tactical Molotov",
                        "description": "Detonate a bottle that releases a lingering fire zone.",
                        "category": "Basic",
                        "price": 200
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/1/1b/Orbital_Strike.png",
                        "name": "Orbital Strike",
                        "description": "Call in an Orbital Strike that deals damage over time in a large area.",
                        "category": "Ultimate",
                        "points": 6
                    }
                ],
                "origin": "USA",
                "release_patch": "Beta",
                "profile_icon": "https://static.wikia.nocookie.net/valorant/images/8/8a/Brimstone_Icon.png",
                "profile_image": "https://static.wikia.nocookie.net/valorant/images/a/ab/Brimstone_Splash_Art.png"
            },
            {
                "agent_id": 2,
                "name": "Viper",
                "role": "Controller",
                "role_icon": "https://static.wikia.nocookie.net/valorant/images/a/ab/Brimstone_Splash_Art.png",
                "abilities": [
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/d/df/Poison_Cloud.png",
                        "name": "Poison Cloud",
                        "description": "Throw an orb that detonates into a poison cloud.",
                        "category": "Basic",
                        "price": 200
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/e/e1/Toxic_Screen.png",
                        "name": "Toxic Screen",
                        "description": "Deploy a line of gas emitters to create a toxic wall.",
                        "category": "Signature",
                        "price": 0
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/8/89/Snake_Bite.png",
                        "name": "Snake Bite",
                        "description": "Detonate a chemical canister to release a toxic burst.",
                        "category": "Basic",
                        "price": 100
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/6/63/Viper_Spit.png",
                        "name": "Viper's Bite",
                        "description": "Detonate a gas emitter to create a large poison cloud.",
                        "category": "Ultimate",
                        "points": 7
                    }
                ],
                "origin": "Unknown",
                "release_patch": "1.0",
                "profile_icon": "https://static.wikia.nocookie.net/valorant/images/9/9c/Viper_Icon.png",
                "profile_image": "https://static.wikia.nocookie.net/valorant/images/3/36/Viper_Splash_Art.png"
            },
            {
                "agent_id": 3,
                "name": "Sage",
                "role": "Sentinel",
                "role_icon": "https://static.wikia.nocookie.net/valorant/images/a/ab/Brimstone_Splash_Art.png",
                "abilities": [
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/8/8a/Barrier_Orb.png",
                        "name": "Barrier Orb",
                        "description": "Place a barrier orb that blocks movement.",
                        "category": "Basic",
                        "price": 400
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/0/0e/Healing_Orb.png",
                        "name": "Healing Orb",
                        "description": "Fire a healing orb to restore health to an ally.",
                        "category": "Signature",
                        "price": 0
                    },
                    {
                        "icon": "https://static.wikia.nocookie.net/valorant/images/e/ed/Resurrection.png",
                        "name": "Resurrection",
                        "description": "Revive a dead ally with full health.",
                        "category": "Ultimate",
                        "points": 8
                    }
                ],
                "origin": "China",
                "release_patch": "Beta",
                "profile_icon": "https://static.wikia.nocookie.net/valorant/images/8/8a/Sage_Icon.png",
                "profile_image": "https://static.wikia.nocookie.net/valorant/images/5/59/Sage_Splash_Art.png"
            }
        ]
    
    async def get_all_agents(self) -> List[ValorantAgent]:
        """Fetch all Valorant agents"""
        try:
            # Try the primary API first
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_urls[0]}/agents")
                if response.status_code == 200:
                    data = response.json()
                    return [self._parse_agent(agent_data) for agent_data in data.get('data', [])]
        except Exception as e:
            logger.warning(f"Could not fetch from API: {e}")
        
        # Fallback to hardcoded data
        logger.info("Using fallback agent data")
        return [self._parse_agent(agent_data) for agent_data in self.fallback_agents]
    
    async def get_agent_by_name(self, name: str) -> Optional[ValorantAgent]:
        """Get a specific agent by name"""
        agents = await self.get_all_agents()
        for agent in agents:
            if agent.name.lower() == name.lower():
                return agent
        return None
    
    async def get_agent_by_id(self, agent_id: int) -> Optional[ValorantAgent]:
        """Get a specific agent by ID"""
        agents = await self.get_all_agents()
        for agent in agents:
            if agent.agent_id == agent_id:
                return agent
        return None
    
    async def get_agent_profile_image(self, name: str) -> Optional[str]:
        """Get agent profile image URL"""
        agent = await self.get_agent_by_name(name)
        return agent.profile_image if agent else None
    
    async def get_agent_profile_icon(self, name: str) -> Optional[str]:
        """Get agent profile icon URL"""
        agent = await self.get_agent_by_name(name)
        return agent.profile_icon if agent else None
    
    async def get_agents_by_role(self, role: str) -> List[ValorantAgent]:
        """Get agents filtered by role (Controller, Sentinel, etc.)"""
        agents = await self.get_all_agents()
        return [agent for agent in agents if agent.role.lower() == role.lower()]
    
    def _parse_agent(self, agent_data: Dict[str, Any]) -> ValorantAgent:
        """Parse raw agent data into ValorantAgent object"""
        return ValorantAgent(
            agent_id=agent_data.get('agent_id', 0),
            name=agent_data.get('name', ''),
            role=agent_data.get('role', ''),
            role_icon=agent_data.get('role_icon', ''),
            abilities=agent_data.get('abilities', []),
            origin=agent_data.get('origin', ''),
            release_patch=agent_data.get('release_patch', ''),
            profile_icon=agent_data.get('profile_icon'),
            profile_image=agent_data.get('profile_image'),
            gallery=agent_data.get('gallery'),
            story=agent_data.get('story')
        )
    
    async def get_agent_abilities(self, name: str) -> List[Dict[str, Any]]:
        """Get specific agent's abilities"""
        agent = await self.get_agent_by_name(name)
        return agent.abilities if agent else []
    
    async def search_agents(self, query: str) -> List[ValorantAgent]:
        """Search agents by name or description"""
        agents = await self.get_all_agents()
        query_lower = query.lower()
        return [
            agent for agent in agents 
            if query_lower in agent.name.lower() or 
            any(query_lower in ability.get('description', '').lower() for ability in agent.abilities)
        ]

# Global instance
valorant_api_service = ValorantAPIService()