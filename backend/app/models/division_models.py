"""
Division Management - Support for multiple eSports divisions
Supports both Mobile Legends (MOBA) and Valorant (Tactical Shooter)
FIXED: Importing shared Base from database.py
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float
# [FIX] Hapus declarative_base(), ganti dengan import dari database
# from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import List, Optional

# [FIX] Import shared Base
from ..database import Base

# Import MatchStatus from models (this is fine)
from .models import MatchStatus

class DivisionType(str, enum.Enum):
    MOBA = "moba"           # Mobile Legends style
    TACTICAL = "tactical"   # Valorant style

class GameModeType(str, enum.Enum):
    RANKED = "ranked"
    CASUAL = "casual"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"

class ValorantAgent(str, enum.Enum):
    BREACH = "breach"
    SAGE = "sage"
    REYNA = "reyna"
    JETT = "jett"
    OMEGA = "omega"
    VIPER = "viper"
    PHOENIX = "phoenix"
    CYPHER = "cypher"
    KILLJOY = "killjoy"
    RAZE = "raze"
    SOVA = "sova"
    BRIMSTONE = "brimstone"
    YORU = "yoru"
    ASTRA = "astra"
    KAYO = "kayo"
    NEON = "neon"
    FADE = "fade"
    HARBOR = "harbor"
    SKYE = "skye"

class Division(Base):
    """Represents different eSports divisions (MOBA, Tactical, etc.)"""
    __tablename__ = "divisions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    division_type = Column(Enum(DivisionType, name="division_type", create_type=False), nullable=False)
    description = Column(Text)
    
    # Game-specific settings
    max_players_per_team = Column(Integer, nullable=False)
    min_players_per_team = Column(Integer, nullable=False)
    team_roles = Column(Text)
    
    # Division-specific features
    has_draft_system = Column(Boolean, default=False)
    has_timeout_system = Column(Boolean, default=False)
    has_agent_selection = Column(Boolean, default=False)
    has_map_pool = Column(Boolean, default=False)
    has_ai_opponent = Column(Boolean, default=False)
    
    # Visual settings
    primary_color = Column(String(7), default="#6366F1")
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
    game_mode_type = Column(Enum(GameModeType, name="game_mode_type", create_type=False), nullable=False)
    
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

# Valorant-specific models
class Agent(Base):
    """Valorant agents with role-based characteristics"""
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    pick_rate = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    ban_rate = Column(Float, default=0.0)
    difficulty = Column(Integer, default=3)
    utility_strength = Column(Float, default=50.0)
    
    agent_stats = relationship("AgentStat", back_populates="agent")
    map_preferences = relationship("MapPreference", back_populates="agent")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgentStat(Base):
    """Player-Agent proficiency relationship"""
    __tablename__ = "agent_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    agent_id = Column(Integer, ForeignKey('agents.id'))
    
    agent_mastery = Column(Float, default=0.0)
    times_played = Column(Integer, default=0)
    last_played = Column(DateTime(timezone=True))
    win_rate = Column(Float, default=0.0)
    avg_kills = Column(Float, default=0.0)
    avg_deaths = Column(Float, default=0.0)
    avg_assists = Column(Float, default=0.0)
    
    player = relationship("Player", back_populates="agent_stats")
    agent = relationship("Agent", back_populates="agent_stats")

class Map(Base):
    """Map pool for tactical shooter division"""
    __tablename__ = "maps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    map_type = Column(String(50), default="tactical")
    description = Column(Text)
    image_url = Column(String(500))
    pick_rate = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    difficulty = Column(Integer, default=3)
    preferred_by_role = Column(String(50))
    site_control_difficulty = Column(Float, default=50.0)
    eco_round_viability = Column(Float, default=50.0)
    retake_difficulty = Column(Float, default=50.0)
    
    map_preferences = relationship("MapPreference", back_populates="map")
    match_maps = relationship("MatchMap", back_populates="map")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MapPreference(Base):
    """Player-Map preference relationship"""
    __tablename__ = "map_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    agent_id = Column(Integer, ForeignKey('agents.id'), nullable=True)
    map_id = Column(Integer, ForeignKey('maps.id'))
    
    preference_level = Column(Float, default=1.0)
    win_rate_on_map = Column(Float, default=0.0)
    agent_specific_win_rate = Column(Float, default=0.0)
    
    player = relationship("Player")
    agent = relationship("Agent", back_populates="map_preferences")
    map = relationship("Map", back_populates="map_preferences")

class MapStat(Base):
    """Player-Map performance statistics"""
    __tablename__ = "map_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    map_name = Column(String(100), nullable=False)
    win_rate = Column(Float, default=0.0)
    times_played = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    favorite_agents = Column(Text)
    site_take_success_rate = Column(Float, default=0.0)
    clutch_success_rate = Column(Float, default=0.0)
    eco_round_performance = Column(Float, default=0.0)
    
    player = relationship("Player")
    
    last_played = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MatchMap(Base):
    """Individual map within a match"""
    __tablename__ = "match_maps"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey('matches.id'))
    map_id = Column(Integer, ForeignKey('maps.id'))
    map_number = Column(Integer, nullable=False)
    
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    overtime_rounds = Column(Integer, default=0)
    duration_minutes = Column(Integer, nullable=True)
    team1_agents = Column(Text)
    team2_agents = Column(Text)
    
    match = relationship("Match", back_populates="match_maps")
    map = relationship("Map", back_populates="match_maps")
    timeout_calls = relationship("TimeoutCall", back_populates="match_map")

class TimeoutCall(Base):
    """Timeout calls during tactical shooter matches"""
    __tablename__ = "timeout_calls"
    
    id = Column(Integer, primary_key=True, index=True)
    match_map_id = Column(Integer, ForeignKey('match_maps.id'))
    team_id = Column(Integer, ForeignKey('teams.id'))
    
    round_number = Column(Integer, nullable=False)
    timeout_duration = Column(Integer, default=60)
    used_for = Column(String(100))
    immediate_impact = Column(Float, default=0.0)
    round_impact = Column(Float, default=0.0)
    
    match_map = relationship("MatchMap", back_populates="timeout_calls")
    team = relationship("Team")

class AIOpponent(Base):
    """Adaptive AI opponents for tactical shooter division"""
    __tablename__ = "ai_opponents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    difficulty_level = Column(Integer, default=1)
    ai_type = Column(String(50), default="adaptive")
    
    aggression_level = Column(Float, default=50.0)
    tactical_flexibility = Column(Float, default=50.0)
    economy_management = Column(Float, default=50.0)
    communication_quality = Column(Float, default=50.0)
    
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    loss_streak = Column(Integer, default=0)
    win_streak = Column(Integer, default=0)
    
    adaptation_rate = Column(Float, default=0.1)
    pattern_recognition = Column(Float, default=50.0)
    
    ai_matches = relationship("AIMatch", back_populates="ai_opponent")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AIMatch(Base):
    """Matches played against AI opponents"""
    __tablename__ = "ai_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    ai_opponent_id = Column(Integer, ForeignKey('ai_opponents.id'))
    human_team_id = Column(Integer, ForeignKey('teams.id'))
    
    human_wins = Column(Boolean, default=False)
    map_score = Column(String(20))
    
    ai_performance_score = Column(Float, default=0.0)
    adaptation_effectiveness = Column(Float, default=0.0)
    strategy_rotation = Column(Integer, default=0)
    
    human_agent_preferences = Column(Text)
    human_map_preferences = Column(Text)
    timeout_usage_pattern = Column(Float, default=0.0)
    
    ai_opponent = relationship("AIOpponent", back_populates="ai_matches")
    human_team = relationship("Team")
    
    match_date = Column(DateTime(timezone=True), server_default=func.now())