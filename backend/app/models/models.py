"""
Database Models for eSports MOBA Manager
FIXED: Changed Enum Columns to String to prevent SQLAlchemy Validation Errors.
Data integrity is still enforced by PostgreSQL Database and Pydantic Schemas.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import List, Optional

# [FIX] Import shared Base
from ..database import Base

# Enums (Tetap ada untuk referensi Pydantic/Logic, tapi tidak dipake di Column)
class RoleType(str, enum.Enum):
    GOLDLANE = "goldlane"
    EXP_SU = "exp_su"
    MIDLANE = "midlane"
    JUNGLE = "jungle"
    ROAM = "roam"

class CoachType(str, enum.Enum):
    MOTIVATOR = "motivator"
    STRATEGIST = "strategist"
    TOUGH_COACH = "tough_coach"
    FLEXIBLE_COACH = "flexible_coach"

class MatchStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    DRAFTING = "drafting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Association tables
hero_preferred_lanes = Table(
    'hero_preferred_lanes',
    Base.metadata,
    Column('hero_id', Integer, ForeignKey('heroes.id')),
    Column('lane_type', String(50)) # [FIX] Changed to String
)

player_hero_stats = Table(
    'player_hero_stats',
    Base.metadata,
    Column('player_id', Integer, ForeignKey('players.id')),
    Column('hero_id', Integer, ForeignKey('heroes.id')),
    Column('hero_power', Float, default=0.0)
)

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Core Attributes
    ovr = Column(Integer, default=50)
    focus = Column(Float, default=50.0)
    mental = Column(Float, default=50.0)
    fatigue = Column(Float, default=0.0)
    
    # [FIX] Changed to String to avoid Enum validation errors
    current_role = Column(String(50), nullable=True)
    
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    experience_level = Column(Integer, default=1)
    training_hours = Column(Integer, default=0)
    
    # MOBA Specifics
    moba_hero_power = Column(Float, default=0.0)
    moba_laning_skill = Column(Float, default=50.0)
    moba_teamfight_presence = Column(Float, default=50.0)
    
    # Tactical Specifics
    tactical_aim = Column(Float, default=50.0)
    tactical_movement = Column(Float, default=50.0)
    tactical_gamesense = Column(Float, default=50.0)
    tactical_communication = Column(Float, default=50.0)
    
    current_division_id = Column(Integer, ForeignKey('divisions.id'), nullable=True)
    division_preference = Column(String(20), default="moba")

    # Relationships
    team = relationship("Team", back_populates="players")
    hero_stats = relationship("HeroStat", back_populates="player")
    agent_stats = relationship("AgentStat", back_populates="player")
    
    # [NEW] Assigned Signature Hero
    assigned_hero_id = Column(Integer, ForeignKey('heroes.id'), nullable=True)
    assigned_hero = relationship("Hero", foreign_keys=[assigned_hero_id])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Hero(Base):
    __tablename__ = "heroes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    icon_url = Column(String(500))  # [NEW] Icon URL
    
    # [NEW] MOBA Details
    hero_class = Column(String(50), nullable=True)     # Fighter, Mage, etc.
    specialty = Column(String(100), nullable=True)     # Burst, CC, etc.
    lane = Column(String(50), nullable=True)           # Exp, Gold, Mid, etc.
    release_year = Column(Integer, default=2024)
    story = Column(Text, nullable=True)
    resource_type = Column(String(30), default="Mana") # Mana, Energy, None
    damage_type = Column(String(30), default="Physical") # Physical, Magic, True
    
    # [NEW] Detailed Stats (JSON for flexibility)
    # { "sustain": 80, "damage": 90, "difficulty": 5, "control": 60 }
    stats = Column(JSON, nullable=True)

    base_power = Column(Float, default=50.0)
    difficulty = Column(Integer, default=3)
    role_specific = Column(Boolean, default=False)
    ban_count = Column(Integer, default=0)
    
    hero_stats = relationship("HeroStat", back_populates="hero")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class HeroStat(Base):
    __tablename__ = "hero_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    hero_power = Column(Float, default=0.0)
    times_played = Column(Integer, default=0)
    last_played = Column(DateTime(timezone=True))
    win_rate = Column(Float, default=0.0)
    
    player = relationship("Player", back_populates="hero_stats")
    hero = relationship("Hero", back_populates="hero_stats")
    
    __table_args__ = ({'extend_existing': True},)

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_short = Column(String(10), nullable=False)
    logo_url = Column(String(500))
    division_id = Column(Integer, ForeignKey('divisions.id'), nullable=False)
    primary_modes = Column(Text)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    total_matches = Column(Integer, default=0)
    team_chemistry = Column(Float, default=50.0)
    
    players = relationship("Player", back_populates="team")
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    coach = relationship("Coach", back_populates="teams")
    division = relationship("Division", back_populates="teams")
    current_draft = relationship("DraftSession", back_populates="current_team")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Coach(Base):
    __tablename__ = "coaches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # [FIX] Changed to String
    coach_type = Column(String(50), nullable=False)
    
    experience_years = Column(Integer, default=0)
    tactical_knowledge = Column(Float, default=50.0)
    motivational_impact = Column(Float, default=0.0)
    strategic_impact = Column(Float, default=0.0)
    
    teams = relationship("Team", back_populates="coach")
    impact_sessions = relationship("CoachImpactSession", back_populates="coach")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DraftSession(Base):
    __tablename__ = "draft_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey('matches.id'))
    session_token = Column(String(255), unique=True, nullable=False)
    phase = Column(String(50), default="waiting") 
    current_team_id = Column(Integer, ForeignKey('teams.id'))
    ban_count_left = Column(Integer, default=3)
    turn_number = Column(Integer, default=0)
    max_turns = Column(Integer, default=20)
    
    match = relationship("Match", back_populates="draft_session")
    current_team = relationship("Team", back_populates="current_draft")
    draft_picks = relationship("DraftPick", back_populates="session")
    
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

class DraftPick(Base):
    __tablename__ = "draft_picks"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('draft_sessions.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    team_id = Column(Integer, ForeignKey('teams.id'))
    is_ban = Column(Boolean, default=False)
    
    # [FIX] Changed to String
    role_assigned = Column(String(50), nullable=True)
    turn_number = Column(Integer, nullable=False)
    
    session = relationship("DraftSession", back_populates="draft_picks")
    hero = relationship("Hero")
    team = relationship("Team")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # [FIX] Changed to String
    status = Column(String(50), default="scheduled")
    
    scheduled_at = Column(DateTime(timezone=True))
    played_at = Column(DateTime(timezone=True))
    
    team1_id = Column(Integer, ForeignKey('teams.id'))
    team2_id = Column(Integer, ForeignKey('teams.id'))
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    winner_team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    division_id = Column(Integer, ForeignKey('divisions.id'))
    game_mode_id = Column(Integer, ForeignKey('game_modes.id'))
    ai_opponent_id = Column(Integer, ForeignKey('ai_opponents.id'), nullable=True)
    total_maps_played = Column(Integer, default=1)
    has_timeout_allowed = Column(Boolean, default=False)
    timeout_calls_used = Column(Integer, default=0)
    max_timeouts = Column(Integer, default=2)

    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_team_id])
    draft_session = relationship("DraftSession", back_populates="match")
    match_maps = relationship("MatchMap", back_populates="match")
    division = relationship("Division")
    game_mode = relationship("GameMode", back_populates="matches")
    ai_opponent = relationship("AIOpponent")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TrainingSession(Base):
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    hours = Column(Float, default=1.0)
    improvement = Column(Float, default=0.0)
    coach_id = Column(Integer, ForeignKey('coaches.id'), nullable=True)
    session_date = Column(DateTime(timezone=True), server_default=func.now())

class CoachImpactSession(Base):
    __tablename__ = "coach_impact_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    player_id = Column(Integer, ForeignKey('players.id'), nullable=True)
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    mental_change = Column(Float, default=0.0)
    focus_change = Column(Float, default=0.0)
    session_type = Column(String(50))
    notes = Column(Text)
    impact_date = Column(DateTime(timezone=True), server_default=func.now())
    coach = relationship("Coach", back_populates="impact_sessions")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    division_preference = Column(String(20), default="moba")
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())