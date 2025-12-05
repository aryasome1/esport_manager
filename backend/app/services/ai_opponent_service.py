"""
AI Opponent Service - Adaptive AI for tactical shooter division
Handles AI pattern recognition, strategy adaptation, and tactical decision making
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import random
import json
from datetime import datetime, timedelta
from collections import defaultdict, deque

from app.models.models import (
    Player, Team, Match
)
from app.models.division_models import (
    Agent, Map, AIOpponent, AIMatch,
    MatchMap, TimeoutCall, AgentStat
)

class AdaptiveAIOpponent:
    """Advanced AI opponent with pattern recognition and strategy adaptation"""
    
    def __init__(self, db: Session, ai_opponent_id: int):
        self.db = db
        self.ai_opponent = self.db.query(AIOpponent).filter(
            AIOpponent.id == ai_opponent_id
        ).first()
        
        if not self.ai_opponent:
            raise ValueError(f"AI opponent with ID {ai_opponent_id} not found")
        
        # Pattern tracking for adaptation
        self.human_patterns = {
            "agent_preferences": defaultdict(float),
            "map_preferences": defaultdict(float),
            "timeout_usage": defaultdict(float),
            "economic_behavior": defaultdict(float),
            "round_strategy": defaultdict(float)
        }
        
        # Strategy rotation tracking
        self.current_strategy = None
        self.strategy_rotation_count = 0
        self.last_strategy_change = datetime.utcnow()
        
        # Performance tracking
        self.recent_performance = deque(maxlen=10)  # Track last 10 matches
        
    def analyze_human_patterns(self, match_id: int) -> Dict:
        """Analyze human player patterns from match data"""
        match = self.db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return {}
        
        # Get human team data
        human_team = self.db.query(Team).filter(Team.id == match.team1_id).first()
        
        # Analyze agent preferences
        agent_preferences = self._analyze_agent_preferences(human_team.id)
        
        # Analyze map preferences
        map_preferences = self._analyze_map_preferences(human_team.id)
        
        # Analyze timeout usage patterns
        timeout_patterns = self._analyze_timeout_patterns(match_id)
        
        # Analyze economic behavior
        economic_patterns = self._analyze_economic_behavior(match_id)
        
        # Update AI memory
        self._update_ai_memory({
            "agent_preferences": agent_preferences,
            "map_preferences": map_preferences,
            "timeout_usage": timeout_patterns,
            "economic_behavior": economic_patterns
        })
        
        return {
            "agent_preferences": agent_preferences,
            "map_preferences": map_preferences,
            "timeout_patterns": timeout_patterns,
            "economic_patterns": economic_patterns
        }
    
    def _analyze_agent_preferences(self, team_id: int) -> Dict:
        """Analyze human team's agent preferences"""
        # Get recent matches and agent usage
        recent_matches = self.db.query(Match).filter(
            and_(
                or_(Match.team1_id == team_id, Match.team2_id == team_id),
                Match.status == "completed"
            )
        ).order_by(desc(Match.played_at)).limit(10).all()
        
        agent_usage = defaultdict(int)
        agent_win_rates = defaultdict(list)
        
        for match in recent_matches:
            match_maps = self.db.query(MatchMap).filter(
                MatchMap.match_id == match.id
            ).all()
            
            for match_map in match_maps:
                # Determine which team is human team
                if match.team1_id == team_id:
                    agents_json = match_map.team1_agents
                else:
                    agents_json = match_map.team2_agents
                
                if agents_json:
                    try:
                        agents = json.loads(agents_json)
                        for agent_id in agents:
                            agent_usage[agent_id] += 1
                            
                            # Track win rate for this agent
                            win = match.winner_team_id == team_id
                            agent_win_rates[agent_id].append(win)
                    except json.JSONDecodeError:
                        continue
        
        # Calculate preferences
        total_usage = sum(agent_usage.values())
        preferences = {}
        
        for agent_id, usage_count in agent_usage.items():
            if total_usage > 0:
                usage_rate = usage_count / total_usage
                avg_win_rate = sum(agent_win_rates[agent_id]) / len(agent_win_rates[agent_id])
                
                # Preference score = usage rate * win rate
                preference_score = usage_rate * avg_win_rate
                preferences[agent_id] = preference_score
        
        return preferences
    
    def _analyze_map_preferences(self, team_id: int) -> Dict:
        """Analyze human team's map preferences"""
        recent_matches = self.db.query(Match).filter(
            and_(
                or_(Match.team1_id == team_id, Match.team2_id == team_id),
                Match.status == "completed"
            )
        ).order_by(desc(Match.played_at)).limit(10).all()
        
        map_usage = defaultdict(int)
        map_win_rates = defaultdict(list)
        
        for match in recent_matches:
            match_maps = self.db.query(MatchMap).filter(
                MatchMap.match_id == match.id
            ).all()
            
            for match_map in match_maps:
                map_usage[match_map.map_id] += 1
                
                # Track win rate for this map
                win = match.winner_team_id == team_id
                map_win_rates[match_map.map_id].append(win)
        
        # Calculate preferences
        preferences = {}
        for map_id, usage_count in map_usage.items():
            win_rates = map_win_rates[map_id]
            avg_win_rate = sum(win_rates) / len(win_rates)
            preferences[map_id] = avg_win_rate
        
        return preferences
    
    def _analyze_timeout_patterns(self, match_id: int) -> Dict:
        """Analyze human team's timeout usage patterns"""
        timeouts = self.db.query(TimeoutCall).filter(
            TimeoutCall.match_map_id.in_(
                self.db.query(MatchMap.id).filter(MatchMap.match_id == match_id).subquery()
            )
        ).all()
        
        timeout_patterns = {
            "avg_timeout_round": 0,
            "favorite_timeout_reasons": defaultdict(int),
            "timeout_frequency": 0,
            "timeout_effectiveness": []
        }
        
        if timeouts:
            # Average timeout round
            timeout_rounds = [t.round_number for t in timeouts]
            timeout_patterns["avg_timeout_round"] = sum(timeout_rounds) / len(timeout_rounds)
            
            # Favorite timeout reasons
            for timeout in timeouts:
                timeout_patterns["favorite_timeout_reasons"][timeout.used_for] += 1
            
            # Timeout effectiveness (simplified calculation)
            for timeout in timeouts:
                effectiveness = random.uniform(40, 80)  # Would calculate actual effectiveness
                timeout_patterns["timeout_effectiveness"].append(effectiveness)
            
            # Timeout frequency per match
            timeout_patterns["timeout_frequency"] = len(timeouts)
        
        return timeout_patterns
    
    def _analyze_economic_behavior(self, match_id: int) -> Dict:
        """Analyze human team's economic behavior patterns"""
        # This would require more detailed match data tracking
        # For now, generate realistic patterns
        
        return {
            "force_buy_frequency": random.uniform(0.1, 0.3),
            "eco_round_success_rate": random.uniform(0.4, 0.7),
            "save_round_tendency": random.uniform(0.2, 0.5),
            "full_buy_penetration": random.uniform(0.1, 0.4)
        }
    
    def _update_ai_memory(self, patterns: Dict):
        """Update AI memory with new pattern data"""
        # Weight new patterns with existing data
        memory_weight = 0.3
        
        for pattern_type, pattern_data in patterns.items():
            if pattern_type in self.human_patterns:
                for key, value in pattern_data.items():
                    if isinstance(value, dict):
                        for sub_key, sub_value in value.items():
                            if isinstance(sub_value, (int, float)):
                                # Update with exponential moving average
                                current = self.human_patterns[pattern_type][f"{key}_{sub_key}"]
                                updated = (1 - memory_weight) * current + memory_weight * sub_value
                                self.human_patterns[pattern_type][f"{key}_{sub_key}"] = updated
    
    def select_adaptive_strategy(self, match_context: Dict) -> Dict:
        """Select adaptive strategy based on pattern analysis"""
        strategies = {
            "agent_counter": self._strategy_agent_counter,
            "map_control": self._strategy_map_control,
            "economic_warfare": self._strategy_economic_warfare,
            "tactical_patience": self._strategy_tactical_patience,
            "aggressive_push": self._strategy_aggressive_push,
            "defense_oriented": self._strategy_defense_oriented
        }
        
        # Analyze which strategy would be most effective
        strategy_scores = {}
        
        for strategy_name, strategy_func in strategies.items():
            try:
                score = strategy_func(match_context)
                strategy_scores[strategy_name] = score
            except Exception:
                strategy_scores[strategy_name] = 0.0
        
        # Consider strategy rotation to avoid predictability
        current_time = datetime.utcnow()
        time_since_change = (current_time - self.last_strategy_change).total_seconds()
        
        if time_since_change > 300:  # 5 minutes
            # Time to potentially rotate strategy
            if self.strategy_rotation_count < 3:
                # Try a different strategy
                best_strategies = sorted(strategy_scores.items(), key=lambda x: x[1], reverse=True)
                self.current_strategy = best_strategies[0][0]
                self.strategy_rotation_count += 1
                self.last_strategy_change = current_time
            else:
                # Return to strongest strategy
                best_strategies = sorted(strategy_scores.items(), key=lambda x: x[1], reverse=True)
                self.current_strategy = best_strategies[0][0]
        
        return {
            "strategy": self.current_strategy,
            "strategy_score": strategy_scores.get(self.current_strategy, 0.0),
            "all_scores": strategy_scores,
            "reasoning": self._generate_strategy_reasoning(self.current_strategy, strategy_scores)
        }
    
    def _strategy_agent_counter(self, context: Dict) -> float:
        """Counter-strategy based on human agent preferences"""
        score = 50.0  # Base score
        
        # Counter agents that human uses frequently and wins with
        agent_prefs = self.human_patterns["agent_preferences"]
        for agent_id, preference in agent_prefs.items():
            if preference > 0.3:  # Human strongly prefers this agent
                # Counter score based on preference strength
                score += preference * 20
        
        return min(100.0, score)
    
    def _strategy_map_control(self, context: Dict) -> float:
        """Focus on map control and site denial"""
        score = 50.0
        
        # AI's own tactical flexibility influences this
        score += self.ai_opponent.tactical_flexibility * 0.3
        
        # Consider map characteristics
        map_id = context.get("map_id")
        if map_id:
            game_map = self.db.query(Map).filter(Map.id == map_id).first()
            if game_map:
                # Higher site control difficulty favors this strategy
                score += game_map.site_control_difficulty * 0.2
        
        return min(100.0, score)
    
    def _strategy_economic_warfare(self, context: Dict) -> float:
        """Focus on economic pressure and force-buy situations"""
        score = 50.0
        
        # AI's economy management influences this
        score += self.ai_opponent.economy_management * 0.3
        
        # Consider human's economic behavior
        econ_behavior = self.human_patterns["economic_behavior"]
        if econ_behavior.get("force_buy_frequency", 0.5) > 0.25:
            score += 15  # Human force-buys frequently, exploit this
        
        return min(100.0, score)
    
    def _strategy_tactical_patience(self, context: Dict) -> float:
        """Focus on patience and waiting for human mistakes"""
        score = 50.0
        
        # AI's aggression level affects this (lower aggression = higher patience score)
        patience_score = 100 - self.ai_opponent.aggression_level
        score += patience_score * 0.2
        
        return min(100.0, score)
    
    def _strategy_aggressive_push(self, context: Dict) -> float:
        """Focus on aggressive plays and early engagements"""
        score = 50.0
        
        # AI's aggression level directly affects this
        score += self.ai_opponent.aggression_level * 0.3
        
        return min(100.0, score)
    
    def _strategy_defense_oriented(self, context: Dict) -> float:
        """Focus on defensive setups and retakes"""
        score = 50.0
        
        # Consider map characteristics
        map_id = context.get("map_id")
        if map_id:
            game_map = self.db.query(Map).filter(Map.id == map_id).first()
            if game_map:
                # Higher retake difficulty favors this strategy
                score += game_map.retake_difficulty * 0.2
        
        return min(100.0, score)
    
    def _generate_strategy_reasoning(self, strategy: str, scores: Dict) -> str:
        """Generate human-readable reasoning for strategy selection"""
        reasoning_map = {
            "agent_counter": "Detected human agent preferences, countering with strategic picks",
            "map_control": "Maximizing map control and site denial opportunities",
            "economic_warfare": "Exploiting economic patterns and force-buy situations",
            "tactical_patience": "Waiting for human mistakes and capitalizing on errors",
            "aggressive_push": "Applying pressure with early engagements and fast-paced plays",
            "defense_oriented": "Focusing on defensive setups and strong retake capabilities"
        }
        
        base_reason = reasoning_map.get(strategy, "Balanced tactical approach")
        
        # Add performance context
        if self.recent_performance:
            win_rate = sum(self.recent_performance) / len(self.recent_performance)
            if win_rate < 0.4:
                base_reason += " (adapting due to recent losses)"
            elif win_rate > 0.7:
                base_reason += " (building on recent success)"
        
        return base_reason
    
    def use_timeout_adaptively(self, match_state: Dict) -> Optional[Dict]:
        """Use timeout strategically based on pattern recognition"""
        current_round = match_state.get("current_round", 1)
        current_score = match_state.get("score", {"team1": 0, "team2": 0})
        ai_score = current_score.get("team2", 0)  # Assuming AI is team2
        
        # Timeout timing patterns
        optimal_timeout_rounds = [6, 12, 18, 24]  # Round numbers for timeouts
        
        # Analyze if timeout would be beneficial
        should_timeout = False
        timeout_reason = None
        
        # Round-based timing
        if current_round in optimal_timeout_rounds:
            should_timeout = True
            timeout_reason = "tactical adjustment"
        
        # Score-based timing (behind in score)
        if ai_score < current_score.get("team1", 0) - 2:
            should_timeout = True
            timeout_reason = "economy discussion"
        
        # Pattern-based timing
        human_timeout_patterns = self.human_patterns["timeout_usage"]
        avg_timeout_round = human_timeout_patterns.get("avg_timeout_round", 12)
        
        if abs(current_round - avg_timeout_round) <= 2:
            should_timeout = True
            timeout_reason = "pistol round prep"
        
        if should_timeout:
            return {
                "use_timeout": True,
                "reason": timeout_reason,
                "expected_effectiveness": self._calculate_timeout_effectiveness(timeout_reason),
                "round_number": current_round
            }
        
        return {"use_timeout": False}
    
    def _calculate_timeout_effectiveness(self, reason: str) -> float:
        """Calculate expected effectiveness of timeout usage"""
        base_effectiveness = {
            "tactical adjustment": 65,
            "pistol round prep": 75,
            "economy discussion": 60,
            "force buy strategy": 70,
            "morale boost": 55
        }
        
        effectiveness = base_effectiveness.get(reason, 60)
        
        # Modify based on AI characteristics
        effectiveness += self.ai_opponent.tactical_flexibility * 0.1
        effectiveness += (100 - self.ai_opponent.aggression_level) * 0.05
        
        return min(100.0, max(0.0, effectiveness))
    
    def select_agents_adaptively(self, map_id: int, round_context: Dict) -> List[int]:
        """Select agents based on adaptive strategy and human patterns"""
        # Get available agents
        all_agents = self.db.query(Agent).all()
        
        # Apply adaptive selection based on strategy
        strategy = self.current_strategy
        
        selected_agents = []
        
        if strategy == "agent_counter":
            # Select agents that counter human preferences
            selected_agents = self._select_counter_agents(all_agents)
        
        elif strategy == "map_control":
            # Select agents strong on current map
            selected_agents = self._select_map_control_agents(all_agents, map_id)
        
        elif strategy == "economic_warfare":
            # Select agents strong in economy warfare
            selected_agents = self._select_economy_agents(all_agents)
        
        elif strategy == "defense_oriented":
            # Select defensive-oriented agents
            selected_agents = self._select_defensive_agents(all_agents)
        
        else:
            # Balanced selection
            selected_agents = self._select_balanced_agents(all_agents)
        
        return [agent.id for agent in selected_agents[:5]]
    
    def _select_counter_agents(self, agents: List) -> List:
        """Select agents that counter human preferences"""
        # Get human's most used agents
        human_preferences = self.human_patterns["agent_preferences"]
        counter_agents = []
        
        # Role-based counters (simplified)
        role_counters = {
            "Duelist": ["Controller", "Sentinel"],
            "Controller": ["Initiator", "Duelist"],
            "Initiator": ["Sentinel", "Controller"],
            "Sentinel": ["Duelist", "Initiator"]
        }
        
        for agent in agents:
            agent_role = agent.role
            # Counters would typically be in role_counters[agent_role]
            # For now, select strong agents that aren't in human preferences
            if agent_role in ["Controller", "Sentinel"]:
                counter_agents.append(agent)
        
        return counter_agents[:5]
    
    def _select_map_control_agents(self, agents: List, map_id: int) -> List:
        """Select agents strong for map control"""
        # Filter agents by map preference (would need more detailed data)
        map_control_agents = [agent for agent in agents 
                            if agent.role in ["Controller", "Initiator"]]
        return map_control_agents[:5]
    
    def _select_economy_agents(self, agents: List) -> List:
        """Select agents strong in economy warfare"""
        # Select agents that are effective on eco rounds
        economy_agents = [agent for agent in agents 
                        if agent.role in ["Controller", "Sentinel"]]
        return economy_agents[:5]
    
    def _select_defensive_agents(self, agents: List) -> List:
        """Select defensive-oriented agents"""
        defensive_agents = [agent for agent in agents 
                          if agent.role in ["Sentinel", "Controller"]]
        return defensive_agents[:5]
    
    def _select_balanced_agents(self, agents: List) -> List:
        """Select balanced team composition"""
        # Ensure balanced team composition
        role_counts = {"Duelist": 0, "Controller": 0, "Initiator": 0, "Sentinel": 0}
        selected = []
        
        # Select one of each role first
        for role in role_counts.keys():
            role_agents = [agent for agent in agents if agent.role == role]
            if role_agents:
                selected.append(random.choice(role_agents))
                role_counts[role] += 1
        
        # Fill remaining slots
        remaining_agents = [agent for agent in agents if agent not in selected]
        while len(selected) < 5 and remaining_agents:
            agent = random.choice(remaining_agents)
            selected.append(agent)
            remaining_agents.remove(agent)
        
        return selected[:5]
    
    def update_performance_metrics(self, match_result: Dict):
        """Update AI performance metrics after match"""
        # Record match performance
        ai_won = match_result.get("ai_won", False)
        self.recent_performance.append(ai_won)
        
        # Update AI opponent statistics
        self.ai_opponent.matches_played += 1
        if ai_won:
            self.ai_opponent.wins += 1
            self.ai_opponent.win_streak += 1
            self.ai_opponent.loss_streak = 0
        else:
            self.ai_opponent.loss_streak += 1
            self.ai_opponent.win_streak = 0
        
        # Update performance score
        total_matches = self.ai_opponent.matches_played
        current_win_rate = self.ai_opponent.wins / total_matches
        
        # Adjust AI characteristics based on performance
        if current_win_rate > 0.7:
            # AI performing well, slightly increase difficulty
            self.ai_opponent.difficulty_level = min(5, self.ai_opponent.difficulty_level + 1)
        elif current_win_rate < 0.3:
            # AI struggling, slightly decrease difficulty
            self.ai_opponent.difficulty_level = max(1, self.ai_opponent.difficulty_level - 1)
        
        self.db.commit()
    
    def get_adaptation_report(self) -> Dict:
        """Get comprehensive adaptation report"""
        return {
            "ai_opponent": {
                "name": self.ai_opponent.name,
                "difficulty_level": self.ai_opponent.difficulty_level,
                "win_rate": self.ai_opponent.wins / max(1, self.ai_opponent.matches_played),
                "current_strategy": self.current_strategy
            },
            "human_patterns": dict(self.human_patterns),
            "recent_performance": {
                "last_10_matches": list(self.recent_performance),
                "current_streak": self.ai_opponent.win_streak if self.ai_opponent.win_streak > 0 else -self.ai_opponent.loss_streak
            },
            "adaptation_metrics": {
                "pattern_recognition_accuracy": self.ai_opponent.pattern_recognition,
                "adaptation_rate": self.ai_opponent.adaptation_rate,
                "strategy_rotation_count": self.strategy_rotation_count
            }
        }