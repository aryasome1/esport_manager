"""
Database Models for eSports MOBA Manager
Complete data model for team management, hero system, and draft mechanics
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import List, Optional

Base = declarative_base()

# Enums for game mechanics
class RoleType(str, enum.Enum):
    GOLDLANE = "goldlane"
    EXPOSU = "exp_su"  # Explane/Exp lane
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

# Association tables for many-to-many relationships
hero_preferred_lanes = Table(
    'hero_preferred_lanes',
    Base.metadata,
    Column('hero_id', Integer, ForeignKey('heroes.id')),
    Column('lane_type', Enum(RoleType))
)

player_hero_stats = Table(
    'player_hero_stats',
    Base.metadata,
    Column('player_id', Integer, ForeignKey('players.id')),
    Column('hero_id', Integer, ForeignKey('heroes.id')),
    Column('hero_power', Float, default=0.0)
)

class Player(Base):
    """Player model with attributes and hero proficiencies"""
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Core Attributes
    ovr = Column(Integer, default=50)  # Overall rating 0-100
    focus = Column(Float, default=50.0)  # Focus level 0-100
    mental = Column(Float, default=50.0)  # Mental state 0-100
    fatigue = Column(Float, default=0.0)  # Fatigue level 0-100 (higher = more tired)
    
    # Current assignment
    current_role = Column(Enum(RoleType), nullable=True)
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    # Training and development
    experience_level = Column(Integer, default=1)
    training_hours = Column(Integer, default=0)
    
    # Relationships
    team = relationship("Team", back_populates="players")
    hero_stats = relationship("HeroStat", back_populates="player")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Hero(Base):
    """Hero model with lane preferences and attributes"""
    __tablename__ = "heroes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    
    # Hero properties
    base_power = Column(Float, default=50.0)  # Base hero power
    difficulty = Column(Integer, default=3)  # 1-5 difficulty rating
    role_specific = Column(Boolean, default=False)
    
    # Lane preferences - relationship to enum is not supported; use explicit table mapping if needed
    # preferred_lanes stored via hero_preferred_lanes table, but no ORM relationship to Enum
    # This avoids mapper initialization errors.
    
    # Bans tracking
    ban_count = Column(Integer, default=0)
    
    # Relationships
    hero_stats = relationship("HeroStat", back_populates="hero")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class HeroStat(Base):
    """Player-Hero proficiency relationship"""
    __tablename__ = "hero_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    
    # Hero-specific player stats
    hero_power = Column(Float, default=0.0)  # Player's proficiency with this hero
    times_played = Column(Integer, default=0)
    last_played = Column(DateTime(timezone=True))
    win_rate = Column(Float, default=0.0)
    
    # Relationships
    player = relationship("Player", back_populates="hero_stats")
    hero = relationship("Hero", back_populates="hero_stats")
    
    # Unique constraint
    __table_args__ = (
        {'extend_existing': True},
    )

class Team(Base):
    """Team model with coach and player management"""
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_short = Column(String(10), nullable=False)
    logo_url = Column(String(500))
    
    # Team statistics
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    total_matches = Column(Integer, default=0)
    
    # Team attributes
    team_chemistry = Column(Float, default=50.0)  # 0-100 team synergy
    
    # Relationships
    players = relationship("Player", back_populates="team")
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    coach = relationship("Coach", back_populates="teams")
    
    # Current draft state (if any)
    current_draft = relationship("DraftSession", back_populates="current_team")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Coach(Base):
    """Coach model with archetype and impact on team dynamics"""
    __tablename__ = "coaches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Coach characteristics
    coach_type = Column(Enum(CoachType), nullable=False)
    experience_years = Column(Integer, default=0)
    tactical_knowledge = Column(Float, default=50.0)  # 0-100
    
    # Coach impact on team dynamics
    motivational_impact = Column(Float, default=0.0)  # +/- impact on mental
    strategic_impact = Column(Float, default=0.0)     # +/- impact on focus
    
    # Relationships
    teams = relationship("Team", back_populates="coach")
    impact_sessions = relationship("CoachImpactSession", back_populates="coach")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DraftSession(Base):
    """Draft session management for match preparation"""
    __tablename__ = "draft_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey('matches.id'))
    session_token = Column(String(255), unique=True, nullable=False)
    
    # Draft state
    phase = Column(String(50), default="waiting")  # waiting, ban, pick, completed
    current_team_id = Column(Integer, ForeignKey('teams.id'))
    ban_count_left = Column(Integer, default=3)
    
    # Turn tracking
    turn_number = Column(Integer, default=0)
    max_turns = Column(Integer, default=20)  # 3 bans + 5 picks per team
    
    # Relationships
    match = relationship("Match", back_populates="draft_session")
    current_team = relationship("Team", back_populates="current_draft")
    draft_picks = relationship("DraftPick", back_populates="session")
    
    # Timestamps
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

class DraftPick(Base):
    """Individual draft picks and bans"""
    __tablename__ = "draft_picks"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('draft_sessions.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    team_id = Column(Integer, ForeignKey('teams.id'))
    
    # Pick/ban information
    is_ban = Column(Boolean, default=False)
    role_assigned = Column(Enum(RoleType), nullable=True)
    turn_number = Column(Integer, nullable=False)
    
    # Relationships
    session = relationship("DraftSession", back_populates="draft_picks")
    hero = relationship("Hero")
    team = relationship("Team")

class Match(Base):
    """Match model for competitive games"""
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Match details
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    scheduled_at = Column(DateTime(timezone=True))
    played_at = Column(DateTime(timezone=True))
    
    # Teams
    team1_id = Column(Integer, ForeignKey('teams.id'))
    team2_id = Column(Integer, ForeignKey('teams.id'))
    
    # Match results
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    winner_team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    # Relationships
    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_team_id])
    draft_session = relationship("DraftSession", back_populates="match")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TrainingSession(Base):
    """Training session for hero power development"""
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    hero_id = Column(Integer, ForeignKey('heroes.id'))
    
    # Training details
    hours = Column(Float, default=1.0)
    improvement = Column(Float, default=0.0)  # Hero power improvement gained
    
    # Coach involvement
    coach_id = Column(Integer, ForeignKey('coaches.id'), nullable=True)
    
    # Timestamps
    session_date = Column(DateTime(timezone=True), server_default=func.now())

class CoachImpactSession(Base):
    """Track coach impact on team/player performance"""
    __tablename__ = "coach_impact_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    player_id = Column(Integer, ForeignKey('players.id'), nullable=True)
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=True)
    
    # Impact metrics
    mental_change = Column(Float, default=0.0)
    focus_change = Column(Float, default=0.0)
    
    # Context
    session_type = Column(String(50))  # "training", "meeting", "pep_talk"
    notes = Column(Text)
    
    # Timestamps
    impact_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    coach = relationship("Coach", back_populates="impact_sessions")

# User model for authentication and account management
class User(Base):
    """User model for authentication and account management"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    
    # Authentication
    password_hash = Column(String(255), nullable=False)
    
    # User preferences
    division_preference = Column(String(20), default="moba")  # "moba" or "valorant"
    
    # Account status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
