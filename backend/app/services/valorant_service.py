"""
Valorant Match Service - Tactical shooter mechanics
Handles agent selection, map control, timeout system, and AI opponent behavior
Enhanced with Grenish Valorant API integration
"""
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import random
import json
import asyncio
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from app.models.models import (
    Player, Team, Match
)
from app.models.division_models import (
    Agent, Map, MatchMap, TimeoutCall,
    AIOpponent, AIMatch, AgentStat, MapPreference, DivisionType
)
from app.schemas.schemas import (
    AgentResponse, MapResponse, MatchMapResponse, TimeoutCallRequest,
    ValorantMatchState, AgentSelection, MapSelection
)
from app.services.valorant_api_service import valorant_api_service, ValorantAgent

class ValorantMatchService:
    """Service for tactical shooter division matches (Valorant)"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_agent_mastery_bonus(self, player_id: int, agent_id: int) -> float:
        """Calculate player mastery bonus for specific agent"""
        agent_stat = self.db.query(AgentStat).filter(
            and_(
                AgentStat.player_id == player_id,
                AgentStat.agent_id == agent_id
            )
        ).first()
        
        if not agent_stat:
            return 0.0
        
        # Mastery contributes up to +20 effectiveness points
        mastery_bonus = (agent_stat.agent_mastery / 100) * 20
        
        return min(20.0, mastery_bonus)
    
    def calculate_role_synergy(self, team_agents: List[int]) -> float:
        """Calculate team synergy based on agent roles"""
        if len(team_agents) < 5:
            return 0.0
        
        # Get agent roles
        agents = self.db.query(Agent).filter(Agent.id.in_(team_agents)).all()
        roles = [agent.role for agent in agents]
        
        # Role distribution scoring
        role_counts = {}
        for role in roles:
            role_counts[role] = role_counts.get(role, 0) + 1
        
        # Ideal team composition (1 of each role)
        ideal_roles = ["Duelist", "Controller", "Initiator", "Sentinel"]
        has_role = {role: role in role_counts for role in ideal_roles}
        
        synergy_score = 0.0
        
        # Base role distribution bonus
        role_bonus = sum(10 for role, has_role in has_role.items() if has_role)
        
        # Role diversity bonus (more diverse = better)
        diversity_bonus = min(20, len(set(roles)) * 5)
        
        # Duplicate role penalty
        duplicate_penalty = 0
        for role, count in role_counts.items():
            if count > 1:
                duplicate_penalty += (count - 1) * 5
        
        synergy_score = role_bonus + diversity_bonus - duplicate_penalty
        
        return max(0.0, min(50.0, synergy_score))
    
    def predict_round_win_probability(self, team1_agents: List[int], team2_agents: List[int], 
                                    team1_players: List[int], team2_players: List[int]) -> float:
        """Predict team win probability for a round"""
        if len(team1_agents) != 5 or len(team2_agents) != 5:
            return 0.5  # Balanced if incomplete teams
        
        # Calculate team strength factors
        team1_strength = 0.0
        team2_strength = 0.0
        
        # Agent mastery contribution
        for i in range(5):
            if i < len(team1_agents) and i < len(team1_players):
                agent_bonus = self.get_agent_mastery_bonus(team1_players[i], team1_agents[i])
                team1_strength += agent_bonus
        
        for i in range(5):
            if i < len(team2_agents) and i < len(team2_players):
                agent_bonus = self.get_agent_mastery_bonus(team2_players[i], team2_agents[i])
                team2_strength += agent_bonus
        
        # Team synergy contribution
        team1_synergy = self.calculate_role_synergy(team1_agents) * 0.1
        team2_synergy = self.calculate_role_synergy(team2_agents) * 0.1
        
        # Player base OVR contribution
        team1_avg_ovr = sum(p.ovr for p in self.db.query(Player).filter(Player.id.in_(team1_players)).all()) / 5
        team2_avg_ovr = sum(p.ovr for p in self.db.query(Player).filter(Player.id.in_(team2_players)).all()) / 5
        
        # Calculate win probability
        team1_total = team1_strength + team1_synergy + (team1_avg_ovr * 0.1)
        team2_total = team2_strength + team2_synergy + (team2_avg_ovr * 0.1)
        
        total_power = team1_total + team2_total
        
        if total_power == 0:
            return 0.5
        
        win_probability = team1_total / total_power
        
        return max(0.05, min(0.95, win_probability))
    
    def select_best_agents(self, player_id: int, map_id: int, team_composition: List[str] = None) -> List[Agent]:
        """Select optimal agents for player based on preferences and team needs"""
        # Get player's agent stats
        agent_stats = self.db.query(AgentStat).filter(AgentStat.player_id == player_id).all()
        
        if not agent_stats:
            # Default to random agents if no stats available
            return self.db.query(Agent).order_by(func.random()).limit(5).all()
        
        # Score agents based on mastery and map preferences
        agent_scores = []
        for stat in agent_stats:
            agent = self.db.query(Agent).filter(Agent.id == stat.agent_id).first()
            if not agent:
                continue
            
            # Base score from mastery
            score = stat.agent_mastery
            
            # Map preference bonus
            map_pref = self.db.query(MapPreference).filter(
                and_(
                    MapPreference.player_id == player_id,
                    MapPreference.map_id == map_id
                )
            ).first()
            
            if map_pref:
                score += map_pref.preference_level * 10
            
            # Team composition consideration
            if team_composition:
                if agent.role in team_composition:
                    score -= 10  # Reduce score if role already filled
            
            agent_scores.append((agent, score))
        
        # Sort by score and return top candidates
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        return [agent for agent, score in agent_scores[:10]]  # Return top 10 candidates
    
    def create_timeout_call(self, match_map_id: int, team_id: int, round_number: int, 
                          reason: str) -> TimeoutCall:
        """Create a timeout call during tactical shooter match"""
        # Check if timeout is allowed
        match_map = self.db.query(MatchMap).filter(MatchMap.id == match_map_id).first()
        if not match_map:
            raise ValueError("Match map not found")
        
        match = self.db.query(Match).filter(Match.id == match_map.match_id).first()
        if not match or not match.has_timeout_allowed:
            raise ValueError("Timeout not allowed for this match")
        
        # Check timeout usage
        timeouts_used = self.db.query(TimeoutCall).filter(
            and_(
                TimeoutCall.match_map_id == match_map_id,
                TimeoutCall.team_id == team_id
            )
        ).count()
        
        if timeouts_used >= match.max_timeouts:
            raise ValueError("No timeouts remaining")
        
        # Create timeout call
        timeout_call = TimeoutCall(
            match_map_id=match_map_id,
            team_id=team_id,
            round_number=round_number,
            used_for=reason
        )
        
        # Update match timeout usage
        match.timeout_calls_used += 1
        
        self.db.add(timeout_call)
        self.db.commit()
        self.db.refresh(timeout_call)
        
        return timeout_call
    
    def calculate_timeout_effectiveness(self, timeout_call_id: int) -> float:
        """Calculate effectiveness of a timeout call"""
        timeout_call = self.db.query(TimeoutCall).filter(TimeoutCall.id == timeout_call_id).first()
        if not timeout_call:
            return 0.0
        
        # Factors affecting timeout effectiveness
        effectiveness = 50.0  # Base effectiveness
        
        # Reason-based modifiers
        reason_effectiveness = {
            "tactical adjustment": 15,
            "pistol round prep": 20,
            "force buy strategy": 10,
            "economy discussion": 12,
            "morale boost": 8,
            "agent swap": 18,
            "map control": 14
        }
        
        reason_modifier = reason_effectiveness.get(timeout_call.used_for, 0)
        effectiveness += reason_modifier
        
        # Round timing modifier (timeouts later in half more effective)
        round_modifier = min(10, timeout_call.round_number * 0.5)
        effectiveness += round_modifier
        
        # Random factor for unpredictability
        random_factor = random.uniform(-5, 5)
        effectiveness += random_factor
        
        return max(0.0, min(100.0, effectiveness))
    
    def simulate_round_outcome(self, match_map_id: int, team1_agents: List[int], 
                             team2_agents: List[int], team1_players: List[int], 
                             team2_players: List[int], has_timeout_bonus: bool = False) -> Dict:
        """Simulate a tactical shooter round outcome"""
        if len(team1_agents) != 5 or len(team2_agents) != 5:
            raise ValueError("Teams must have exactly 5 agents each")
        
        # Calculate win probability
        team1_win_prob = self.predict_round_win_probability(
            team1_agents, team2_agents, team1_players, team2_players
        )
        
        # Apply timeout bonus if applicable
        if has_timeout_bonus:
            team1_win_prob = min(0.85, team1_win_prob + 0.05)
        
        # Simulate round outcome
        team1_wins = random.random() < team1_win_prob
        
        # Generate round statistics
        round_stats = {
            "winning_team": 1 if team1_wins else 2,
            "round_score": {
                1: 1 if team1_wins else 0,
                2: 1 if not team1_wins else 0
            },
            "round_time": random.randint(90, 150),  # seconds
            "kills": {
                1: random.randint(0, 5),
                2: random.randint(0, 5)
            },
            "assists": {
                1: random.randint(0, 3),
                2: random.randint(0, 3)
            },
            "economic_impact": random.choice(["win", "loss", "save", "force", "eco"])
        }
        
        # Update player statistics (simplified)
        self._update_round_statistics(
            match_map_id, team1_players, team2_players, 
            team1_agents, team2_agents, round_stats
        )
        
        return round_stats
    
    def _update_round_statistics(self, match_map_id: int, team1_players: List[int], 
                               team2_players: List[int], team1_agents: List[int], 
                               team2_agents: List[int], round_stats: Dict):
        """Update player statistics after round"""
        winner_team = round_stats["winning_team"]
        
        # Update team1 players
        for i, player_id in enumerate(team1_players):
            agent_id = team1_agents[i] if i < len(team1_agents) else None
            if not agent_id:
                continue
            
            # Get or create agent stat
            agent_stat = self.db.query(AgentStat).filter(
                and_(
                    AgentStat.player_id == player_id,
                    AgentStat.agent_id == agent_id
                )
            ).first()
            
            if not agent_stat:
                agent_stat = AgentStat(
                    player_id=player_id,
                    agent_id=agent_id,
                    times_played=0,
                    agent_mastery=0.0
                )
                self.db.add(agent_stat)
            
            # Update stats
            agent_stat.times_played += 1
            agent_stat.last_played = datetime.utcnow()
            
            # Update performance metrics
            kills = round_stats["kills"][1] // 5 + random.randint(0, 1)  # Distribute kills
            deaths = random.randint(0, 2) if winner_team != 1 else random.randint(1, 3)
            assists = round_stats["assists"][1] // 5 + random.randint(0, 1)
            
            # Update averages (simplified)
            if agent_stat.times_played == 1:
                agent_stat.avg_kills = float(kills)
                agent_stat.avg_deaths = float(deaths)
                agent_stat.avg_assists = float(assists)
            else:
                total_rounds = agent_stat.times_played
                agent_stat.avg_kills = (agent_stat.avg_kills * (total_rounds - 1) + kills) / total_rounds
                agent_stat.avg_deaths = (agent_stat.avg_deaths * (total_rounds - 1) + deaths) / total_rounds
                agent_stat.avg_assists = (agent_stat.avg_assists * (total_rounds - 1) + assists) / total_rounds
            
            # Update win rate
            if winner_team == 1:
                current_wins = agent_stat.win_rate * (agent_stat.times_played - 1)
                agent_stat.win_rate = (current_wins + 1) / agent_stat.times_played
            else:
                current_wins = agent_stat.win_rate * (agent_stat.times_played - 1)
                agent_stat.win_rate = current_wins / agent_stat.times_played
        
        # Similar update for team2 players
        winner_team == 2 if winner_team == 2 else winner_team == 1
        for i, player_id in enumerate(team2_players):
            agent_id = team2_agents[i] if i < len(team2_agents) else None
            if not agent_id:
                continue
            
            agent_stat = self.db.query(AgentStat).filter(
                and_(
                    AgentStat.player_id == player_id,
                    AgentStat.agent_id == agent_id
                )
            ).first()
            
            if not agent_stat:
                agent_stat = AgentStat(
                    player_id=player_id,
                    agent_id=agent_id,
                    times_played=0,
                    agent_mastery=0.0
                )
                self.db.add(agent_stat)
            
            agent_stat.times_played += 1
            agent_stat.last_played = datetime.utcnow()
            
            # Update team2 stats similarly
            wins = 1 if winner_team == 2 else 0
            current_wins = agent_stat.win_rate * (agent_stat.times_played - 1)
            agent_stat.win_rate = (current_wins + wins) / agent_stat.times_played
        
        self.db.commit()
    
    def get_map_advantage(self, map_id: int, agent_team: List[int]) -> float:
        """Calculate map advantage for specific agent composition"""
        game_map = self.db.query(Map).filter(Map.id == map_id).first()
        if not game_map:
            return 0.0
        
        advantage = 0.0
        
        # Get agent roles for the team
        agents = self.db.query(Agent).filter(Agent.id.in_(agent_team)).all()
        roles = [agent.role for agent in agents]
        
        # Map-specific role advantages
        role_advantages = {
            "Duelist": 5.0,
            "Controller": 8.0,
            "Initiator": 7.0,
            "Sentinel": 6.0
        }
        
        for role in set(roles):
            advantage += role_advantages.get(role, 0.0)
        
        # Map difficulty modifier
        difficulty_modifier = (game_map.difficulty - 3) * 2.0  # Normalize difficulty
        advantage -= difficulty_modifier
        
        # Site control and retake factors
        advantage += game_map.site_control_difficulty * 0.1
        advantage += game_map.retake_difficulty * 0.1
        
        return max(-20.0, min(20.0, advantage))
    
    def generate_agent_recommendations(self, player_id: int, map_id: int, 
                                     team_composition: Dict[str, int]) -> List[Dict]:
        """Generate AI-powered agent recommendations"""
        # Get player's agent statistics
        agent_stats = self.db.query(AgentStat).filter(AgentStat.player_id == player_id).all()
        
        recommendations = []
        
        for stat in agent_stats:
            agent = self.db.query(Agent).filter(Agent.id == stat.agent_id).first()
            if not agent:
                continue
            
            # Calculate recommendation score
            score = stat.agent_mastery
            
            # Map preference boost
            map_pref = self.db.query(MapPreference).filter(
                and_(
                    MapPreference.player_id == player_id,
                    MapPreference.map_id == map_id
                )
            ).first()
            
            if map_pref:
                score += map_pref.preference_level * 15
            
            # Team composition consideration
            if agent.role not in team_composition or team_composition[agent.role] == 0:
                score += 10  # Bonus for filling needed role
            else:
                score -= 5  # Penalty for duplicate role
            
            # Agent synergy with team
            synergy_bonus = self._calculate_agent_team_synergy(agent.id, team_composition)
            score += synergy_bonus
            
            # Difficulty consideration
            difficulty_modifier = (5 - agent.difficulty) * 2  # Prefer less difficult agents
            score += difficulty_modifier
            
            recommendations.append({
                "agent": agent,
                "score": max(0, score),
                "recommendation_reason": self._generate_recommendation_reason(agent, score, map_pref, team_composition)
            })
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:5]
    
    def _calculate_agent_team_synergy(self, agent_id: int, team_composition: Dict[str, int]) -> float:
        """Calculate synergy score between agent and team composition"""
        agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return 0.0
        
        synergy = 0.0
        
        # Role diversity bonus
        if agent.role not in team_composition or team_composition[agent.role] == 0:
            synergy += 10  # Bonus for unique role
        else:
            synergy -= 5   # Penalty for duplicate role
        
        # Role combination bonuses
        role_combinations = {
            ("Controller", "Initiator"): 8,
            ("Sentinel", "Controller"): 6,
            ("Duelist", "Initiator"): 7,
            ("Sentinel", "Duelist"): 4
        }
        
        for role in team_composition:
            if team_composition[role] > 0:
                combination = tuple(sorted([agent.role, role]))
                if combination in role_combinations:
                    synergy += role_combinations[combination]
        
        return synergy
    
    def _generate_recommendation_reason(self, agent, score: float, map_pref, team_composition: Dict[str, int]) -> str:
        """Generate human-readable reason for agent recommendation"""
        reasons = []
        
        if map_pref and map_pref.preference_level > 1.5:
            reasons.append("High performance on this map")
        
        if agent.role not in team_composition or team_composition[agent.role] == 0:
            reasons.append(f"Fills needed {agent.role} role")
        
        if score > 80:
            reasons.append("Excellent agent mastery")
        elif score > 60:
            reasons.append("Strong agent proficiency")
        elif score > 40:
            reasons.append("Good agent fit")
        
        return " • ".join(reasons) if reasons else "Balanced choice"
    
    def validate_team_composition(self, agent_team: List[int]) -> Tuple[bool, List[str]]:
        """Validate if team composition meets tactical requirements"""
        errors = []
        
        if len(agent_team) != 5:
            errors.append("Team must have exactly 5 agents")
            return False, errors
        
        # Get agent roles
        agents = self.db.query(Agent).filter(Agent.id.in_(agent_team)).all()
        roles = [agent.role for agent in agents]
        role_counts = {}
        for role in roles:
            role_counts[role] = role_counts.get(role, 0) + 1
        
        # Check for required roles
        required_roles = ["Controller", "Initiator", "Sentinel", "Duelist"]
        missing_roles = [role for role in required_roles if role not in role_counts]
        
        if missing_roles:
            errors.append(f"Missing required roles: {', '.join(missing_roles)}")
        
        # Check for role limits
        for role, count in role_counts.items():
            if count > 2:
                errors.append(f"Too many {role} agents ({count}/2)")
        
        return len(errors) == 0, errors
    
    # =====================================================
    # Valorant API Integration Methods
    # =====================================================
    
    async def get_valorant_agents_from_api(self) -> List[ValorantAgent]:
        """Get all Valorant agents from the Grenish API"""
        return await valorant_api_service.get_all_agents()
    
    async def get_agent_from_api_by_name(self, name: str) -> Optional[ValorantAgent]:
        """Get specific agent data from API by name"""
        return await valorant_api_service.get_agent_by_name(name)
    
    async def get_agent_abilities_from_api(self, agent_name: str) -> List[Dict[str, Any]]:
        """Get agent abilities from API"""
        return await valorant_api_service.get_agent_abilities(agent_name)
    
    async def sync_agents_from_api(self) -> List[Agent]:
        """Sync agents from API to local database"""
        try:
            api_agents = await valorant_api_service.get_all_agents()
            synced_agents = []
            
            for api_agent in api_agents:
                # Check if agent exists in database
                existing_agent = self.db.query(Agent).filter(
                    Agent.name == api_agent.name
                ).first()
                
                if existing_agent:
                    # Update existing agent
                    existing_agent.role = api_agent.role
                    existing_agent.difficulty = self._map_difficulty_from_api(api_agent.role)
                    existing_agent.abilities = json.dumps(api_agent.abilities)
                    existing_agent.origin_country = api_agent.origin
                    existing_agent.release_patch = api_agent.release_patch
                    synced_agents.append(existing_agent)
                else:
                    # Create new agent
                    new_agent = Agent(
                        name=api_agent.name,
                        role=api_agent.role,
                        difficulty=self._map_difficulty_from_api(api_agent.role),
                        abilities=json.dumps(api_agent.abilities),
                        origin_country=api_agent.origin,
                        release_patch=api_agent.release_patch,
                        is_active=True
                    )
                    self.db.add(new_agent)
                    synced_agents.append(new_agent)
            
            self.db.commit()
            
            # Refresh to get IDs
            for agent in synced_agents:
                self.db.refresh(agent)
                
            return synced_agents
            
        except Exception as e:
            logger.error(f"Failed to sync agents from API: {e}")
            return []
    
    async def get_agent_recommendations_from_api(self, player_id: int, 
                                               preferred_role: str = None,
                                               map_name: str = None) -> List[Dict]:
        """Get agent recommendations from API based on player preferences"""
        try:
            all_agents = await valorant_api_service.get_all_agents()
            
            # Filter by role if specified
            if preferred_role:
                all_agents = [agent for agent in all_agents 
                            if agent.role.lower() == preferred_role.lower()]
            
            # Get player's existing agent stats
            player_agent_stats = self.db.query(AgentStat).filter(
                AgentStat.player_id == player_id
            ).all()
            
            player_agent_names = {stat.agent_id for stat in player_agent_stats}
            
            recommendations = []
            for api_agent in all_agents:
                # Calculate recommendation score
                score = 50.0  # Base score
                
                # Role preference bonus
                if preferred_role and api_agent.role.lower() == preferred_role.lower():
                    score += 20
                
                # Map synergy (if map specified)
                if map_name:
                    map_bonus = self._get_map_agent_synergy(api_agent, map_name)
                    score += map_bonus
                
                # Difficulty consideration
                difficulty_bonus = self._get_difficulty_bonus(api_agent)
                score += difficulty_bonus
                
                # Experience consideration (prefer agents player hasn't used much)
                if api_agent.name not in player_agent_names:
                    score += 15  # Bonus for new agents
                
                recommendations.append({
                    "agent": api_agent,
                    "score": score,
                    "recommendation_reason": self._generate_api_recommendation_reason(
                        api_agent, score, preferred_role, map_name
                    )
                })
            
            # Sort by score and return top 5
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            return recommendations[:5]
            
        except Exception as e:
            logger.error(f"Failed to get agent recommendations: {e}")
            return []
    
    async def get_agent_strategy_guide(self, agent_name: str) -> Dict[str, Any]:
        """Get comprehensive strategy guide for an agent from API"""
        try:
            agent = await valorant_api_service.get_agent_by_name(agent_name)
            if not agent:
                return {}
            
            # Build strategy guide
            guide = {
                "agent_name": agent.name,
                "role": agent.role,
                "abilities": agent.abilities,
                "origin": agent.origin,
                "release_info": agent.release_patch,
                "strategies": self._generate_strategy_tips(agent),
                "team_composition_tips": self._generate_composition_tips(agent),
                "map_specific_tips": self._generate_map_tips(agent),
                "economic_tips": self._generate_economic_tips(agent)
            }
            
            return guide
            
        except Exception as e:
            logger.error(f"Failed to get strategy guide for {agent_name}: {e}")
            return {}
    
    def _map_difficulty_from_api(self, role: str) -> int:
        """Map API role data to difficulty levels (1-5 scale)"""
        difficulty_mapping = {
            "Duelist": 4,      # High mechanical skill required
            "Initiator": 3,    # Moderate tactical knowledge needed
            "Controller": 2,   # Lower mechanical skill, good game sense
            "Sentinel": 2      # Support role, moderate difficulty
        }
        return difficulty_mapping.get(role, 3)
    
    def _get_map_agent_synergy(self, agent: ValorantAgent, map_name: str) -> float:
        """Calculate synergy between agent and map"""
        # Map-agent synergy mapping (simplified)
        synergy_map = {
            "Bind": {"Controller": 15, "Initiator": 10, "Sentinel": 8},
            "Haven": {"Controller": 12, "Sentinel": 12, "Initiator": 8},
            "Split": {"Initiator": 15, "Controller": 10, "Duelist": 8},
            "Ascent": {"Controller": 12, "Initiator": 10, "Sentinel": 8},
            "Icebox": {"Controller": 15, "Sentinel": 12, "Initiator": 8}
        }
        
        return synergy_map.get(map_name, {}).get(agent.role, 0)
    
    def _get_difficulty_bonus(self, agent: ValorantAgent) -> float:
        """Get difficulty-based recommendation bonus"""
        # Prefer less difficult agents for newer players
        return 10.0  # Simplified - could be based on agent.difficulty
    
    def _generate_api_recommendation_reason(self, agent: ValorantAgent, score: float, 
                                          preferred_role: str = None, map_name: str = None) -> str:
        """Generate recommendation reason for API agent"""
        reasons = []
        
        if preferred_role and agent.role.lower() == preferred_role.lower():
            reasons.append(f"Perfect {preferred_role} role fit")
        
        if map_name:
            synergy = self._get_map_agent_synergy(agent, map_name)
            if synergy > 10:
                reasons.append(f"Excellent synergy with {map_name}")
            elif synergy > 5:
                reasons.append(f"Good on {map_name}")
        
        if score > 80:
            reasons.append("Highly recommended")
        elif score > 60:
            reasons.append("Strong choice")
        elif score > 40:
            reasons.append("Good option")
        
        return " • ".join(reasons) if reasons else "Balanced choice"
    
    def _generate_strategy_tips(self, agent: ValorantAgent) -> List[str]:
        """Generate role-specific strategy tips"""
        role_strategies = {
            "Controller": [
                "Control vision with smoke/abilities",
                "Support teammates with utility",
                "Play for information and space",
                "Coordinate with initiators for executes"
            ],
            "Duelist": [
                "Create openings for team",
                "Take aggressive fights",
                "Use mobility to create advantages",
                "Communicate intentions clearly"
            ],
            "Initiator": [
                "Create opportunities for team",
                "Use utility to initiate fights",
                "Support entry fraggers",
                "Coordinate timing with team"
            ],
            "Sentinel": [
                "Hold defensive angles",
                "Support teammates with utility",
                "Gather information",
                "Anchor site retakes"
            ]
        }
        
        return role_strategies.get(agent.role, ["Play to agent strengths", "Communicate with team"])
    
    def _generate_composition_tips(self, agent: ValorantAgent) -> List[str]:
        """Generate team composition tips for agent"""
        return [
            f"Works well with {agent.role} role",
            "Coordinate utility usage",
            "Play to agent's strengths",
            "Adapt strategy based on map and enemy team"
        ]
    
    def _generate_map_tips(self, agent: ValorantAgent) -> List[str]:
        """Generate map-specific tips for agent"""
        return [
            "Adapt positioning to map layout",
            "Use map geometry to your advantage",
            "Coordinate with team on rotations",
            "Play site-specific strategies"
        ]
    
    def _generate_economic_tips(self, agent: ValorantAgent) -> List[str]:
        """Generate economic tips for agent"""
        return [
            "Manage credits effectively",
            "Save utility for important rounds",
            "Communicate buy/force/save decisions",
            "Consider team's economy when making calls"
        ]