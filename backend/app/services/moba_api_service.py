"""
Mobile Legends: Bang Bang API Service
Integrates with the ridwaanhall Mobile Legends API for comprehensive hero data
"""

import httpx
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging
import asyncio

logger = logging.getLogger(__name__)

class MobileLegendsAPIService:
    """Service for integrating with Mobile Legends: Bang Bang API"""
    
    def __init__(self):
        self.base_url = "https://mlbb-stats.ridwaanhall.com/api"
        self.timeout = 10
    
    async def get_all_heroes(self) -> List[Dict]:
        """
        Fetch all Mobile Legends heroes from the API
        
        Returns:
            List of hero data dictionaries
        """
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-list/")
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 0 and 'data' in data:
                        return data['data'].get('records', [])
                    else:
                        logger.warning(f"Unexpected API response format: {data}")
                        return self._get_fallback_heroes()
                else:
                    logger.error(f"API request failed with status code: {response.status_code}")
                    return self._get_fallback_heroes()
        except Exception as e:
            logger.error(f"Error fetching heroes from Mobile Legends API: {e}")
            return self._get_fallback_heroes()
    
    async def get_hero_detail(self, hero_id: int, hero_name: Optional[str] = None) -> Optional[Dict]:
        """
        Fetch detailed information for a specific hero
        
        Args:
            hero_id: ID of the hero
            hero_name: Name of the hero (optional)
            
        Returns:
            Detailed hero data or None if not found
        """
        try:
            # Try with hero_id first
            if hero_name:
                url = f"{self.base_url}/hero-detail/{hero_name}/"
            else:
                url = f"{self.base_url}/hero-detail/{hero_id}/"
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 0 and 'data' in data:
                        records = data['data'].get('records', [])
                        if records:
                            return records[0]  # Return first record
                    logger.warning(f"Hero detail not found for ID/name: {hero_id}/{hero_name}")
                    return None
                else:
                    logger.error(f"API request failed with status code: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching hero detail: {e}")
            return None
    
    async def get_hero_rankings(self) -> Optional[Dict]:
        """Get hero rankings data"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-rank/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero rankings: {e}")
            return None
    
    async def get_hero_positions(self) -> Optional[Dict]:
        """Get hero position data"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-position/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero positions: {e}")
            return None
    
    async def get_hero_skill_combo(self, hero_id: int) -> Optional[Dict]:
        """Get skill combinations for a hero"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-skill-combo/{hero_id}/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero skill combo: {e}")
            return None
    
    async def get_hero_rate(self, hero_id: int) -> Optional[Dict]:
        """Get hero rating data"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-rate/{hero_id}/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero rate: {e}")
            return None
    
    async def get_hero_relations(self, hero_id: int) -> Optional[Dict]:
        """Get hero relationship data (assist, strong, weak)"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-relation/{hero_id}/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero relations: {e}")
            return None
    
    async def get_hero_counters(self, hero_id: int) -> Optional[Dict]:
        """Get hero counter information"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-counter/{hero_id}/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero counters: {e}")
            return None
    
    async def get_hero_compatibility(self, hero_id: int) -> Optional[Dict]:
        """Get hero compatibility information"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.get(f"{self.base_url}/hero-compatibility/{hero_id}/")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error fetching hero compatibility: {e}")
            return None
    
    def _get_fallback_heroes(self) -> List[Dict]:
        """
        Fallback hero data in case API is unavailable
        Based on common Mobile Legends heroes
        """
        return [
            {
                "hero_id": 1,
                "name": "Miya",
                "role": "Marksman",
                "position": "Gold Lane",
                "description": "The Priestess of the Moon and protector of the Moonlit Forest",
                "image_url": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_da894b37bfb5cadb32307f371f31918a.png",
                "difficulty": 3,
                "specialty": ["Finisher", "Damage"],
                "difficulty_level": "Medium",
                "base_power": 75.0
            },
            {
                "hero_id": 6,
                "name": "Tigreal",
                "role": "Tank",
                "position": "Tank",
                "description": "A brave knight who leads the defense of the kingdom",
                "image_url": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_8b30576754be1a4f8bebd09df8d6bec7.png",
                "difficulty": 2,
                "specialty": ["Control", "Tank"],
                "difficulty_level": "Easy",
                "base_power": 70.0
            },
            {
                "hero_id": 18,
                "name": "Layla",
                "role": "Marksman",
                "position": "Gold Lane",
                "description": "A skilled archer with exceptional long-range capabilities",
                "image_url": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_b2b38e9406ea0de0b866db7674feea0f.png",
                "difficulty": 2,
                "specialty": ["Damage", "Long Range"],
                "difficulty_level": "Easy",
                "base_power": 72.0
            },
            {
                "hero_id": 26,
                "name": "Chou",
                "role": "Fighter",
                "position": "Mid Lane",
                "description": "The Legendary Fist Fighter with incredible martial arts skills",
                "image_url": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_158209b180032c4564b8f3bde8c48888.png",
                "difficulty": 4,
                "specialty": ["Control", "Fight"],
                "difficulty_level": "Hard",
                "base_power": 80.0
            },
            {
                "hero_id": 56,
                "name": "Gusion",
                "role": "Assassin",
                "position": "Mid Lane",
                "description": "A mysterious assassin with lightning-fast movements",
                "image_url": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_c6cd232de60da5372a7101a203e56554.png",
                "difficulty": 5,
                "specialty": ["Burst", "Assassin"],
                "difficulty_level": "Very Hard",
                "base_power": 85.0
            }
        ]
    
    def transform_hero_data(self, hero_record: Dict) -> Dict:
        """
        Transform Mobile Legends API hero data to match our schema
        
        Args:
            hero_record: Raw hero data from API
            
        Returns:
            Transformed hero data
        """
        if not hero_record:
            return {}
        
        hero_data = hero_record.get('data', {})
        hero_info = hero_data.get('hero', {}).get('data', {})
        
        # Extract role and position information
        roles = hero_info.get('sortlabel', [''])
        role = roles[0] if roles else "Unknown"
        
        positions = hero_info.get('roadsortlabel', [''])
        position = positions[0] if positions else "Unknown"
        
        # Extract specialty
        specialties = hero_info.get('speciality', [])
        specialty_str = ', '.join(specialties) if specialties else "General"
        
        # Calculate difficulty level
        difficulty = hero_info.get('difficulty', '3')
        try:
            diff_int = int(difficulty)
            if diff_int <= 2:
                difficulty_level = "Easy"
            elif diff_int <= 3:
                difficulty_level = "Medium"
            elif diff_int <= 4:
                difficulty_level = "Hard"
            else:
                difficulty_level = "Very Hard"
        except (ValueError, TypeError):
            difficulty_level = "Medium"
        
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
                    "tags": [tag.get('tagname', '') for tag in skill.get('skilltag', [])]
                })
        
        return {
            "hero_id": hero_data.get('hero_id', 0),
            "name": hero_info.get('name', ''),
            "role": role,
            "position": position,
            "description": hero_info.get('story', ''),
            "image_url": hero_info.get('head', ''),
            "square_image_url": hero_info.get('squarehead', ''),
            "difficulty": int(difficulty) if difficulty.isdigit() else 3,
            "difficulty_level": difficulty_level,
            "specialty": specialty_str,
            "abilities": abilities,
            "recommend_level": hero_info.get('recommendlevellabel', ''),
            "base_power": self._calculate_base_power(role, specialty_str)
        }
    
    def _calculate_base_power(self, role: str, specialty: str) -> float:
        """Calculate base power based on role and specialty"""
        base_power = 60.0  # Base power
        
        # Role-based power adjustments
        role_adjustments = {
            "Marksman": 15.0,
            "Assassin": 20.0,
            "Fighter": 12.0,
            "Tank": 8.0,
            "Mage": 10.0,
            "Support": 5.0
        }
        
        base_power += role_adjustments.get(role, 0.0)
        
        # Specialty-based adjustments
        if "Burst" in specialty:
            base_power += 5.0
        if "Control" in specialty:
            base_power += 3.0
        if "Tank" in specialty:
            base_power += 5.0
        
        return min(base_power, 100.0)  # Cap at 100.0
    
    def get_personalized_recommendations(self, player_preferences: Dict) -> List[Dict]:
        """
        Generate personalized hero recommendations based on player preferences
        
        Args:
            player_preferences: Dict with preferences like preferred_role, difficulty_level, play_style
            
        Returns:
            List of recommended heroes
        """
        preferred_role = player_preferences.get('preferred_role', '').lower()
        preferred_difficulty = player_preferences.get('difficulty_level', 'Medium').lower()
        play_style = player_preferences.get('play_style', '').lower()
        
        # Get all heroes and filter based on preferences
        heroes = self._get_fallback_heroes()
        
        recommendations = []
        for hero in heroes:
            score = 0.0
            
            # Role match
            if preferred_role and preferred_role in hero.get('role', '').lower():
                score += 20.0
            
            # Difficulty match
            if preferred_difficulty == 'easy' and hero.get('difficulty_level') == 'Easy':
                score += 15.0
            elif preferred_difficulty == 'medium' and hero.get('difficulty_level') == 'Medium':
                score += 15.0
            elif preferred_difficulty == 'hard' and hero.get('difficulty_level') in ['Hard', 'Very Hard']:
                score += 15.0
            
            # Play style match
            if 'aggressive' in play_style and 'Burst' in hero.get('specialty', ''):
                score += 10.0
            elif 'defensive' in play_style and 'Tank' in hero.get('specialty', ''):
                score += 10.0
            elif 'support' in play_style and 'Support' in hero.get('specialty', ''):
                score += 10.0
            
            hero['recommendation_score'] = score
            recommendations.append(hero)
        
        # Sort by recommendation score
        recommendations.sort(key=lambda x: x.get('recommendation_score', 0), reverse=True)
        return recommendations[:5]  # Return top 5 recommendations
    
    def get_hero_strategy_guide(self, hero_id: int) -> Dict:
        """
        Generate strategy guide for a specific hero
        
        Args:
            hero_id: ID of the hero
            
        Returns:
            Strategy guide with tips and recommendations
        """
        hero_detail = None
        try:
            hero_detail = self.get_hero_detail(hero_id)
        except Exception as e:
            logger.error(f"Error getting hero detail for strategy guide: {e}")
        
        if hero_detail:
            transformed_hero = self.transform_hero_data(hero_detail)
            role = transformed_hero.get('role', '')
            position = transformed_hero.get('position', '')
            
            return {
                "hero_name": transformed_hero.get('name', ''),
                "role": role,
                "position": position,
                "difficulty": transformed_hero.get('difficulty_level', 'Medium'),
                "gameplay_tips": self._generate_gameplay_tips(role, position),
                "item_builds": self._generate_item_builds(role),
                "positioning_tips": self._generate_positioning_tips(role, position),
                "teamfight_strategy": self._generate_teamfight_strategy(role),
                "laning_phase": self._generate_laning_advice(position),
                "power_spikes": self._generate_power_spikes(role)
            }
        else:
            # Fallback strategy guide
            return self._get_fallback_strategy_guide(hero_id)
    
    def _generate_gameplay_tips(self, role: str, position: str) -> List[str]:
        """Generate role-specific gameplay tips"""
        tips = {
            "Marksman": [
                "Focus on last hitting minions for gold",
                "Stay behind your tank in teamfights",
                "Position yourself safely during laning phase",
                "Use your range advantage to poke enemies",
                "Rotate to teamfights as soon as possible"
            ],
            "Tank": [
                "Initiate teamfights with crowd control",
                "Protect your teammates from assassins",
                "Take the lead in setting up ganks",
                "Roam the map to control vision",
                "Stay in front during team engagements"
            ],
            "Assassin": [
                "Focus on eliminating high-value targets",
                "Wait for the right moment to engage",
                "Learn to position yourself for quick escapes",
                "Gank enemy lanes frequently",
                "Take advantage of enemy positioning mistakes"
            ],
            "Fighter": [
                "Balance between offense and defense",
                "Look for opportunities to engage",
                "Protect your carries in teamfights",
                "Control objective fights",
                "Use your sustain to stay in fights longer"
            ],
            "Mage": [
                "Focus on area damage in teamfights",
                "Control vision with your abilities",
                "Harass enemies from a safe distance",
                "Save your crowd control for key moments",
                "Rotate quickly between lanes"
            ]
        }
        
        return tips.get(role, [
            "Understand your role in the team",
            "Communicate with your teammates",
            "Practice your skill combos",
            "Focus on farming and objectives",
            "Stay aware of the minimap"
        ])
    
    def _generate_item_builds(self, role: str) -> List[str]:
        """Generate role-specific item recommendations"""
        builds = {
            "Marksman": [
                "Start with Boots of Speed and basic attacks",
                "Core items: Blade of Despair, Berserker's Fury",
                "Follow up with wind of nature for defense",
                "Complete with physical penetration items",
                "Consider Guardian Helmet for late game sustain"
            ],
            "Tank": [
                "Start with Courage Mask for sustain",
                "Core items: Antique Cuirass, Athona's Shield",
                "Add Oracle for magic defense",
                "Complete with items based on enemy team",
                "Consider Immortality for teamfight insurance"
            ],
            "Assassin": [
                "Start with Hunter Strike for mobility",
                "Core items: Blade of the Heptaseas, Endless Battle",
                "Add Golden Staff for attack speed",
                "Complete with physical penetration",
                "Consider Winter Truncheon for escape"
            ]
        }
        
        return builds.get(role, [
            "Adapt your build based on the enemy team",
            "Focus on core role-specific items first",
            "Consider defensive options when behind",
            "Build penetration against tanky opponents",
            "Save slots for consumables and wards"
        ])
    
    def _generate_positioning_tips(self, role: str, position: str) -> List[str]:
        """Generate positioning advice"""
        tips = []
        
        if "Gold Lane" in position:
            tips.append("Stay in the outer lane near your tower")
            tips.push("Ward the river bushes to see ganks")
        elif "Mid Lane" in position:
            tips.append("Control the center of the map")
            tips.append("Rotate quickly between lanes")
        elif "Tank" in position:
            tips.append("Lead your team's movements")
            tips.append("Take initiative in setting up plays")
        else:
            tips.append("Stay with your team during teamfights")
            tips.append("Don't overextend without vision")
        
        return tips
    
    def _generate_teamfight_strategy(self, role: str) -> List[str]:
        """Generate teamfight strategy"""
        strategies = {
            "Marksman": [
                "Stay in the backline and focus on the nearest enemy",
                "Don't chase kills - focus on staying alive",
                "Use your range to damage multiple enemies"
            ],
            "Tank": [
                "Initiate the fight with crowd control",
                "Protect your carries from assassins",
                "Stay in front of your team"
            ],
            "Assassin": [
                "Wait for the enemy carries to use their crowd control",
                "Focus on eliminating priority targets",
                "Have an escape plan before engaging"
            ]
        }
        
        return strategies.get(role, [
            "Understand your team's win condition",
            "Focus on your role in teamfights",
            "Stay alive to contribute throughout the fight"
        ])
    
    def _generate_laning_advice(self, position: str) -> List[str]:
        """Generate laning phase advice"""
        advice = []
        
        if "Gold Lane" in position:
            advice.extend([
                "Focus on last hitting for gold efficiency",
                "Don't trade aggressively without your tank",
                "Keep the wave pushed when roaming"
            ])
        elif "Mid Lane" in position:
            advice.extend([
                "Control the river and side bushes",
                "Rotate quickly to help other lanes",
                "Farm efficiently while looking for ganks"
            ])
        else:
            advice.extend([
                "Focus on farming while staying safe",
                "Ward important areas to avoid ganks",
                "Communicate with your team about enemy movements"
            ])
        
        return advice
    
    def _generate_power_spikes(self, role: str) -> List[str]:
        """Generate power spike information"""
        spikes = {
            "Marksman": [
                "Level 4: Ultimate ability available",
                "After first core item: Significant damage increase",
                "Level 12: Major damage spike with skill points"
            ],
            "Tank": [
                "Level 2: Core crowd control abilities",
                "After first defense item: Better survivability",
                "Level 10: Ultimate ability for team initiation"
            ],
            "Assassin": [
                "Level 4: Gap closing abilities available",
                "After mobility item: High kill potential",
                "Level 15: Maximum burst damage potential"
            ]
        }
        
        return spikes.get(role, [
            "Level 2: First power spike with skill upgrades",
            "Mid-game: Major spike after core items",
            "Late game: Final spike with full build"
        ])
    
    def _get_fallback_strategy_guide(self, hero_id: int) -> Dict:
        """Fallback strategy guide when API data is unavailable"""
        heroes = self._get_fallback_heroes()
        hero = next((h for h in heroes if h['hero_id'] == hero_id), heroes[0])
        
        return {
            "hero_name": hero.get('name', 'Unknown Hero'),
            "role": hero.get('role', 'Unknown'),
            "position": hero.get('position', 'Unknown'),
            "difficulty": hero.get('difficulty_level', 'Medium'),
            "gameplay_tips": [
                "Understand your role in team compositions",
                "Practice your skill rotations and combos",
                "Focus on farming and map awareness",
                "Communicate with your team about objectives",
                "Learn from each game to improve your play"
            ],
            "item_builds": [
                "Adapt your build based on enemy team composition",
                "Focus on core items first, then situational items",
                "Consider both offensive and defensive options",
                "Build penetration against high armor targets",
                "Don't forget about consumables and wards"
            ],
            "positioning_tips": [
                "Stay with your team during important fights",
                "Ward and deward strategically",
                "Don't overextend without vision of enemies",
                "Use terrain to your advantage",
                "Know when to disengage from fights"
            ],
            "teamfight_strategy": [
                "Focus on your role in teamfights",
                "Prioritize targets based on their threat level",
                "Save important abilities for key moments",
                "Stay alive to contribute throughout the fight",
                "Coordinate with your team for engages and disengages"
            ],
            "laning_phase": [
                "Focus on last hitting for gold efficiency",
                "Don't take unnecessary trades",
                "Ward important areas to avoid ganks",
                "Communicate with your jungler for ganks",
                "Be ready to rotate when needed"
            ],
            "power_spikes": [
                "Level 2: First power spike with skill upgrades",
                "Mid-game: Major spike after core items",
                "Late game: Final spike with full build"
            ]
        }