"""
Division Management - Support for multiple eSports divisions
Supports both Mobile Legends (MOBA) and Valorant (Tactical Shooter)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import List, Optional

# Import MatchStatus from models
from .models import MatchStatus

Base = declarative_base()

class DivisionType(str, enum.Enum):
    MOBA = "moba"           # Mobile Legends style
    TACTICAL = "tactical"   # Valorant style

class GameMode(str, enum.Enum):
    RANKED = "ranked"       # Competitive ranked matches
    CASUAL = "casual"       # Unranked casual matches
    TOURNAMENT = "tournament"  # Tournament/bracket matches
    PRACTICE = "practice"   # Practice/training matches

class Division(Base):
    """Represents different eSports divisions (MOBA, Tactical, etc.)"""
    __tablename__ = "divisions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    division_type = Column(Enum(DivisionType), nullable=False)
    description = Column(Text)
    
    # Game-specific settings
    max_players_per_team = Column(Integer, nullable=False)
    min_players_per_team = Column(Integer, nullable=False)
    team_roles = Column(Text)  # JSON array of roles
    
    # Division-specific features
    has_draft_system = Column(Boolean, default=False)
    has_timeout_system = Column(Boolean, default=False)
    has_agent_selection = Column(Boolean, default=False)
    has_map_pool = Column(Boolean, default=False)
    has_ai_opponent = Column(Boolean, default=False)
    
    # Visual settings
    primary_color = Column(String(7), default="#6366F1")  # Hex color
    secondary_color = Column(String(7), default="#10B981")
    
    # Relationships
    teams = relationship("Team", back_populates="division")
    game_modes = relationship("GameMode", back_populates="division")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class GameMode(Base):
    """Game modes for each division"""
    __tablename__ = "game_modes"
    
    id = Column(Integer, primary_key=True, index=True)
    division_id = Column(Integer, ForeignKey('divisions.id'))
    name = Column(String(100), nullable=False)
    game_mode_type = Column(Enum(GameMode), nullable=False)
    
    # Mode-specific settings
    max_players = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    overtime_duration = Column(Integer, default=0)
    
    # Mode features
    requires_draft = Column(Boolean, default=False)
    allows_timeout = Column(Boolean, default=False)
    supports_ai_opponent = Column(Boolean, default=False)
    
    # Relationships
    division = relationship("Division", back_populates="game_modes")
    matches = relationship("Match", back_populates="game_mode")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Update Team model to include division
class Team(Base):
    """Team model with division support"""
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_short = Column(String(10), nullable=False)
    logo_url = Column(String(500))
    
    # Division and mode support
    division_id = Column(Integer, ForeignKey('divisions.id'), nullable=False)
    primary_modes = Column(Text)  # JSON array of preferred game modes
    
    # Team statistics
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    total_matches = Column(Integer, default=0)
    
    # Team attributes
    team_chemistry = Column(Float, default=50.0)  # 0-100 team synergy
    
    # Relationships
    division = relationship("Division", back_populates="teams")
    players = relationship("Player", back_populates="team")
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    coach = relationship("Coach", back_populates="teams", foreign_keys="Team.coach_id")
    
    # Current draft state (if any)
    current_draft = relationship("DraftSession", back_populates="current_team")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Update Player model to support both divisions
class Player(Base):
    """Player model with division-specific attributes"""
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Core attributes (universal)
    ovr = Column(Integer, default=50)  # Overall rating 0-100
    focus = Column(Float, default=50.0)  # Focus level 0-100
    mental = Column(Float, default=50.0)  # Mental state 0-100
    fatigue = Column(Float, default=0.0)  # Fatigue level 0-100
    
    # Division and role assignment
    current_division_id = Column(Integer, ForeignKey('divisions.id'), nullable=True)
    current_role = Column(String(50), nullable=True)  # Role name (varies by division)
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    # MOBA-specific attributes (Mobile Legends)
    moba_hero_power = Column(Float, default=0.0)  # MOBA hero mastery
    moba_laning_skill = Column(Float, default=50.0)  # Lane control ability
    moba_teamfight_presence = Column(Float, default=50.0)  # Team fight performance
    
    # Tactical Shooter attributes (Valorant)
    tactical_aim = Column(Float, default=50.0)  # Shooting accuracy
    tactical_movement = Column(Float, default=50.0)  # Movement and positioning
    tactical_gamesense = Column(Float, default=50.0)  # Game awareness
    tactical_communication = Column(Float, default=50.0)  # Team communication
    
    # Training and development
    experience_level = Column(Integer, default=1)
    training_hours = Column(Integer, default=0)
    
    # Relationships
    team = relationship("Team", back_populates="players")
    hero_stats = relationship("HeroStat", back_populates="player")
    agent_stats = relationship("AgentStat", back_populates="player")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Valorant-specific models
class Agent(Base):
    """Valorant agents with role-based characteristics"""
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # Duelist, Controller, Initiator, Sentinel
    description = Column(Text)
    image_url = Column(String(500))
    
    # Agent statistics
    pick_rate = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    ban_rate = Column(Float, default=0.0)
    
    # Agent properties
    difficulty = Column(Integer, default=3)  # 1-5 difficulty rating
    utility_strength = Column(Float, default=50.0)  # 0-100 utility effectiveness
    
    # Relationships
    agent_stats = relationship("AgentStat", back_populates="agent")
    map_preferences = relationship("MapPreference", back_populates="agent")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgentStat(Base):
    """Player-Agent proficiency relationship"""
    __tablename__ = "agent_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    agent_id = Column(Integer, ForeignKey('agents.id'))
    
    # Agent-specific player stats
    agent_mastery = Column(Float, default=0.0)  # Player's proficiency with this agent
    times_played = Column(Integer, default=0)
    last_played = Column(DateTime(timezone=True))
    win_rate = Column(Float, default=0.0)
    
    # Performance metrics
    avg_kills = Column(Float, default=0.0)
    avg_deaths = Column(Float, default=0.0)
    avg_assists = Column(Float, default=0.0)
    
    # Relationships
    player = relationship("Player", back_populates="agent_stats")
    agent = relationship("Agent", back_populates="agent_stats")

class Map(Base):
    """Map pool for tactical shooter division"""
    __tablename__ = "maps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    map_type = Column(String(50), default="tactical")  # tactical, hybrid, etc.
    description = Column(Text)
    image_url = Column(String(500))
    
    # Map statistics
    pick_rate = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    
    # Map properties
    difficulty = Column(Integer, default=3)  # 1-5 difficulty rating
    preferred_by_role = Column(String(50))  # Which role benefits most
    
    # Map characteristics
    site_control_difficulty = Column(Float, default=50.0)  # 0-100 site taking difficulty
    eco_round_viability = Column(Float, default=50.0)  # 0-100 viability on eco rounds
    retake_difficulty = Column(Float, default=50.0)  # 0-100 site retake difficulty
    
    # Relationships
    map_preferences = relationship("MapPreference", back_populates="map")
    match_maps = relationship("MatchMap", back_populates="map")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MapPreference(Base):
    """Player-Map preference relationship"""
    __tablename__ = "map_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    agent_id = Column(Integer, ForeignKey('agents.id'), nullable=True)
    map_id = Column(Integer, ForeignKey('maps.id'))
    
    # Preference metrics
    preference_level = Column(Float, default=1.0)  # 0-2 how much player likes this map
    win_rate_on_map = Column(Float, default=0.0)
    
    # Map-specific performance
    agent_specific_win_rate = Column(Float, default=0.0)  # Win rate with specific agent on this map
    
    # Relationships
    player = relationship("Player")  # Back reference
    agent = relationship("Agent", back_populates="map_preferences")
    map = relationship("Map", back_populates="map_preferences")

class MapStat(Base):
    """Player-Map performance statistics"""
    __tablename__ = "map_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    map_name = Column(String(100), nullable=False)
    
    # Performance metrics
    win_rate = Column(Float, default=0.0)
    times_played = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    favorite_agents = Column(Text)  # JSON array of agent names
    
    # Map-specific stats
    site_take_success_rate = Column(Float, default=0.0)
    clutch_success_rate = Column(Float, default=0.0)
    eco_round_performance = Column(Float, default=0.0)
    
    # Relationships
    player = relationship("Player")  # Back reference
    
    # Timestamps
    last_played = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MatchMap(Base):
    """Individual map within a match"""
    __tablename__ = "match_maps"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey('matches.id'))
    map_id = Column(Integer, ForeignKey('maps.id'))
    map_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    
    # Score tracking
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    
    # Map details
    overtime_rounds = Column(Integer, default=0)
    duration_minutes = Column(Integer, nullable=True)
    
    # Team compositions
    team1_agents = Column(Text)  # JSON array of agents
    team2_agents = Column(Text)  # JSON array of agents
    
    # Relationships
    match = relationship("Match", back_populates="match_maps")
    map = relationship("Map", back_populates="match_maps")
    timeout_calls = relationship("TimeoutCall", back_populates="match_map")

class TimeoutCall(Base):
    """Timeout calls during tactical shooter matches"""
    __tablename__ = "timeout_calls"
    
    id = Column(Integer, primary_key=True, index=True)
    match_map_id = Column(Integer, ForeignKey('match_maps.id'))
    team_id = Column(Integer, ForeignKey('teams.id'))
    
    # Timeout details
    round_number = Column(Integer, nullable=False)
    timeout_duration = Column(Integer, default=60)  # 60 seconds typical
    used_for = Column(String(100))  # "tactical adjustment", "pistol round prep", etc.
    
    # Effectiveness tracking
    immediate_impact = Column(Float, default=0.0)  # 0-100 immediate effect score
    round_impact = Column(Float, default=0.0)  # 0-100 round outcome improvement
    
    # Relationships
    match_map = relationship("MatchMap", back_populates="timeout_calls")
    team = relationship("Team")

# AI Opponent System
class AIOpponent(Base):
    """Adaptive AI opponents for tactical shooter division"""
    __tablename__ = "ai_opponents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    difficulty_level = Column(Integer, default=1)  # 1-5 AI difficulty
    ai_type = Column(String(50), default="adaptive")  # "adaptive", "reactive", "predictive"
    
    # AI characteristics
    aggression_level = Column(Float, default=50.0)  # 0-100 aggression
    tactical_flexibility = Column(Float, default=50.0)  # 0-100 strategic adaptation
    economy_management = Column(Float, default=50.0)  # 0-100 money management
    communication_quality = Column(Float, default=50.0)  # 0-100 team coordination
    
    # Performance tracking
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    loss_streak = Column(Integer, default=0)
    win_streak = Column(Integer, default=0)
    
    # Learning and adaptation
    adaptation_rate = Column(Float, default=0.1)  # 0-1 how quickly AI adapts
    pattern_recognition = Column(Float, default=50.0)  # 0-100 ability to recognize patterns
    
    # Relationships
    ai_matches = relationship("AIMatch", back_populates="ai_opponent")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AIMatch(Base):
    """Matches played against AI opponents"""
    __tablename__ = "ai_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    ai_opponent_id = Column(Integer, ForeignKey('ai_opponents.id'))
    human_team_id = Column(Integer, ForeignKey('teams.id'))
    
    # Match outcome
    human_wins = Column(Boolean, default=False)
    map_score = Column(String(20))  # "13-11", "2-0", etc.
    
    # AI performance metrics
    ai_performance_score = Column(Float, default=0.0)  # 0-100 overall AI performance
    adaptation_effectiveness = Column(Float, default=0.0)  # 0-100 how well AI adapted
    strategy_rotation = Column(Integer, default=0)  # How many different strategies AI tried
    
    # Patterns observed
    human_agent_preferences = Column(Text)  # JSON of preferred agents
    human_map_preferences = Column(Text)  # JSON of preferred maps
    timeout_usage_pattern = Column(Float, default=0.0)  # 0-100 frequency of timeout usage
    
    # Relationships
    ai_opponent = relationship("AIOpponent", back_populates="ai_matches")
    human_team = relationship("Team")
    
    # Timestamps
    match_date = Column(DateTime(timezone=True), server_default=func.now())

# Update Match model to support multiple divisions
class Match(Base):
    """Universal match model supporting all divisions"""
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Match identification
    division_id = Column(Integer, ForeignKey('divisions.id'))
    game_mode_id = Column(Integer, ForeignKey('game_modes.id'))
    
    # Match details
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    scheduled_at = Column(DateTime(timezone=True))
    played_at = Column(DateTime(timezone=True))
    
    # Teams
    team1_id = Column(Integer, ForeignKey('teams.id'))
    team2_id = Column(Integer, ForeignKey('teams.id'))  # Can be null for AI matches
    
    # AI opponent (for tactical shooter)
    ai_opponent_id = Column(Integer, ForeignKey('ai_opponents.id'), nullable=True)
    
    # Match results
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    winner_team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    total_maps_played = Column(Integer, default=1)
    
    # Division-specific features
    has_timeout_allowed = Column(Boolean, default=False)
    timeout_calls_used = Column(Integer, default=0)
    max_timeouts = Column(Integer, default=2)
    
    # Relationships
    division = relationship("Division")
    game_mode = relationship("GameMode", back_populates="matches")
    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    ai_opponent = relationship("AIOpponent")
    winner = relationship("Team", foreign_keys=[winner_team_id])
    draft_session = relationship("DraftSession", back_populates="match")
    match_maps = relationship("MatchMap", back_populates="match")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())