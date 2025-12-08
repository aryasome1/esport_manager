"""
Comprehensive Pydantic schemas for eSports Manager API
FIXED: Ensured DraftSessionResponse and all dependencies are correctly defined and ordered.
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Import Enums from models
from ..models.models import RoleType, CoachType, MatchStatus
from ..models.division_models import DivisionType, ValorantAgent, GameModeType

# --- BASE SCHEMAS ---
class TimestampBase(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class HeroPreferredLane(BaseModel):
    lane: RoleType
    preference_level: float = Field(default=1.0, ge=0.1, le=2.0)

# --- AUTHENTICATION ---
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    division_preference: Optional[DivisionType] = DivisionType.MOBA

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    division_preference: Optional[DivisionType] = None
    is_active: Optional[bool] = None

class User(UserBase, TimestampBase):
    id: int
    full_name: Optional[str]
    division_preference: DivisionType
    team_id: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

# --- PLAYERS ---
class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50)

class PlayerCreate(PlayerBase):
    password: str = Field(..., min_length=8)
    division_preference: Optional[DivisionType] = DivisionType.MOBA
    current_role: Optional[RoleType] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    current_role: Optional[RoleType] = None
    focus: Optional[float] = Field(None, ge=0.0, le=100.0)
    mental: Optional[float] = Field(None, ge=0.0, le=100.0)
    fatigue: Optional[float] = Field(None, ge=0.0, le=100.0)
    experience_level: Optional[int] = Field(None, ge=0)
    training_hours: Optional[int] = Field(None, ge=0)

class Player(PlayerBase, TimestampBase):
    id: int
    ovr: int = Field(..., ge=0, le=100)
    focus: float = Field(..., ge=0.0, le=100.0)
    mental: float = Field(..., ge=0.0, le=100.0)
    fatigue: float = Field(..., ge=0.0, le=100.0)
    current_role: Optional[RoleType]
    team_id: Optional[int]
    experience_level: int
    training_hours: int
    division_preference: Optional[Union[DivisionType, str]] = DivisionType.MOBA
    moba_laning_skill: Optional[float] = 50.0
    moba_teamfight_presence: Optional[float] = 50.0
    tactical_aim: Optional[float] = 50.0
    tactical_gamesense: Optional[float] = 50.0
    is_active: bool = True

    class Config:
        from_attributes = True

class PlayerWithHeroStats(Player):
    hero_stats: List = []
    team: Optional[object] = None

# --- HEROES ---
class HeroBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    base_power: float = Field(default=50.0, ge=0.0, le=100.0)
    difficulty: int = Field(default=3, ge=1, le=5)
    role_specific: bool = False

class HeroCreate(HeroBase):
    preferred_lanes: List[RoleType] = []

class HeroUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    base_power: Optional[float] = Field(None, ge=0.0, le=100.0)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    preferred_lanes: Optional[List[RoleType]] = None

class Hero(HeroBase, TimestampBase):
    id: int
    preferred_lanes: List[RoleType] = []
    ban_count: int

    class Config:
        from_attributes = True

# --- HERO STATS ---
class HeroStatBase(BaseModel):
    player_id: int
    hero_id: int

class HeroStatCreate(HeroStatBase):
    hero_power: float = Field(default=0.0, ge=0.0, le=100.0)

class HeroStatUpdate(BaseModel):
    hero_power: Optional[float] = Field(None, ge=0.0, le=100.0)
    times_played: Optional[int] = Field(None, ge=0)
    win_rate: Optional[float] = Field(None, ge=0.0, le=100.0)

class HeroStatResponse(HeroStatBase):
    id: int
    hero_power: float
    times_played: int
    last_played: Optional[datetime]
    win_rate: float
    hero: Hero

    class Config:
        from_attributes = True

class HeroWithStats(Hero):
    hero_stats: List[HeroStatResponse] = []
    
    class Config:
        from_attributes = True

# --- TEAMS ---
class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    name_short: str = Field(..., min_length=2, max_length=10)

class TeamCreate(TeamBase):
    coach_id: Optional[int] = None
    division_type: Optional[DivisionType] = DivisionType.MOBA

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    name_short: Optional[str] = Field(None, min_length=2, max_length=10)
    coach_id: Optional[int] = None
    team_chemistry: Optional[float] = Field(None, ge=0.0, le=100.0)

class Team(TeamBase, TimestampBase):
    id: int
    wins: int = 0
    losses: int = 0
    total_matches: int = 0
    team_chemistry: float = 50.0
    coach_id: Optional[int]
    
    class Config:
        from_attributes = True

TeamResponse = Team
HeroResponse = Hero

class TeamWithDetails(Team):
    players: List[object] = []
    coach: Optional[object] = None

# --- COACHES ---
class CoachBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50)

class CoachCreate(CoachBase):
    password: str = Field(..., min_length=8)
    coach_type: CoachType
    experience_years: int = Field(default=0, ge=0)
    tactical_knowledge: float = Field(default=50.0, ge=0.0, le=100.0)

class CoachUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    coach_type: Optional[CoachType] = None
    experience_years: Optional[int] = Field(None, ge=0)
    tactical_knowledge: Optional[float] = Field(None, ge=0.0, le=100.0)
    motivational_impact: Optional[float] = Field(None, ge=-50.0, le=50.0)
    strategic_impact: Optional[float] = Field(None, ge=-50.0, le=50.0)

class Coach(CoachBase, TimestampBase):
    id: int
    coach_type: CoachType
    experience_years: int
    tactical_knowledge: float
    motivational_impact: float = 0.0
    strategic_impact: float = 0.0
    is_active: bool = True

    class Config:
        from_attributes = True

CoachResponse = Coach

# --- MATCHES ---
class MatchBase(BaseModel):
    team1_id: int
    team2_id: int
    scheduled_at: datetime

class MatchCreate(MatchBase):
    game_mode: Optional[GameModeType] = None

class MatchUpdate(BaseModel):
    status: Optional[MatchStatus] = None
    scheduled_at: Optional[datetime] = None
    played_at: Optional[datetime] = None
    team1_score: Optional[int] = Field(None, ge=0)
    team2_score: Optional[int] = Field(None, ge=0)
    winner_team_id: Optional[int] = None

class MatchResponse(MatchBase):
    id: int
    status: MatchStatus
    scheduled_at: datetime
    played_at: Optional[datetime]
    team1_score: int = 0
    team2_score: int = 0
    winner_team_id: Optional[int]
    game_mode: Optional[GameModeType]
    team1: Team
    team2: Team
    winner: Optional[Team] = None
    draft_session: Optional[Any] = None

    class Config:
        from_attributes = True

# --- DRAFT SYSTEM (FIXED) ---
class DraftSessionBase(BaseModel):
    match_id: int

class DraftSessionCreate(DraftSessionBase):
    pass

class DraftPickRequest(BaseModel):
    hero_id: int
    is_ban: bool = False
    role_assigned: Optional[RoleType] = None

class DraftPick(BaseModel):
    id: int
    hero_id: Optional[int] = None
    team_id: int
    is_ban: bool = False
    role_assigned: Optional[RoleType] = None
    turn_number: int

class DraftSessionResponse(DraftSessionBase):
    id: int
    session_token: str
    phase: str
    current_team_id: Optional[int]
    ban_count_left: int
    turn_number: int
    max_turns: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    current_team: Optional[Team]
    draft_picks: List[DraftPick] = []

    class Config:
        from_attributes = True

class DraftPickResponse(BaseModel):
    id: int
    hero_id: int
    team_id: int
    is_ban: bool
    role_assigned: Optional[RoleType]
    turn_number: int
    hero: Hero
    team: Team

class DraftState(BaseModel):
    session: DraftSessionResponse
    available_heroes: List[Hero]
    team1_lineup: Dict[str, int]
    team2_lineup: Dict[str, int]
    banned_heroes: List[int]

    class Config:
        from_attributes = True

# --- TRAINING & MISC ---
class TrainingSessionBase(BaseModel):
    player_id: int
    hero_id: int
    hours: float = Field(default=1.0, ge=0.1, le=8.0)
    coach_id: Optional[int] = None

class TrainingSessionCreate(TrainingSessionBase):
    pass

class TrainingSessionResponse(TrainingSessionBase):
    id: int
    improvement: float
    session_date: datetime
    player: Player
    hero: Hero
    coach: Optional[Coach] = None

    class Config:
        from_attributes = True

class BaseResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool = False
    has_prev: bool = False

# --- VALORANT / TACTICAL ---
class AgentStatBase(BaseModel):
    player_id: int
    agent_name: ValorantAgent

class AgentStatCreate(AgentStatBase):
    mastery_level: float = Field(default=0.0, ge=0.0, le=100.0)

class AgentStatUpdate(BaseModel):
    mastery_level: Optional[float] = Field(None, ge=0.0, le=100.0)
    matches_played: Optional[int] = Field(None, ge=0)
    win_rate: Optional[float] = Field(None, ge=0.0, le=100.0)

class AgentStatResponse(AgentStatBase):
    id: int
    mastery_level: float
    matches_played: int
    win_rate: float
    last_played: Optional[datetime]

    class Config:
        from_attributes = True

class MapStatBase(BaseModel):
    player_id: int
    map_name: str
    win_rate: float = Field(default=0.0, ge=0.0, le=100.0)
    times_played: int = Field(default=0, ge=0)

class MapStatCreate(MapStatBase):
    pass

class MapStatUpdate(BaseModel):
    win_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    times_played: Optional[int] = Field(None, ge=0)
    avg_score: Optional[float] = Field(None, ge=0.0)
    favorite_agents: Optional[List[ValorantAgent]] = []

class MapStatResponse(MapStatBase):
    id: int
    avg_score: float
    favorite_agents: List[ValorantAgent] = []

    class Config:
        from_attributes = True

class AgentResponse(BaseModel):
    id: int
    name: str
    role: str
    description: Optional[str]
    pick_rate: float
    win_rate: float
    difficulty: int

    class Config:
        from_attributes = True

class MapResponse(BaseModel):
    id: int
    name: str
    map_type: str
    description: Optional[str]
    difficulty: int
    pick_rate: float

    class Config:
        from_attributes = True

class MatchMapResponse(BaseModel):
    id: int
    match_id: int
    map_id: int
    map_number: int
    map: MapResponse

    class Config:
        from_attributes = True

class TimeoutCallRequest(BaseModel):
    match_id: int
    team_id: int
    round_number: int
    timeout_duration: int = 60
    used_for: str = "tactical adjustment"

class ValorantMatchState(BaseModel):
    match_id: int
    current_map: int
    team1_agents: List[ValorantAgent]
    team2_agents: List[ValorantAgent]
    team1_score: int
    team2_score: int
    round_number: int
    timeout_calls_remaining: Dict[str, int]

class AgentSelection(BaseModel):
    player_id: int
    agent: ValorantAgent
    selection_order: int

class MapSelection(BaseModel):
    map_name: str
    selection_order: int
    is_pick: bool

class AIProfileBase(BaseModel):
    name: str
    difficulty_level: int = Field(default=1, ge=1, le=5)
    ai_type: str = "adaptive"

class AIProfileUpdate(BaseModel):
    name: Optional[str] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    ai_type: Optional[str] = None
    aggression_level: Optional[float] = Field(None, ge=0.0, le=100.0)
    tactical_flexibility: Optional[float] = Field(None, ge=0.0, le=100.0)
    economy_management: Optional[float] = Field(None, ge=0.0, le=100.0)
    communication_quality: Optional[float] = Field(None, ge=0.0, le=100.0)

class AIProfileResponse(AIProfileBase):
    id: int
    aggression_level: float
    tactical_flexibility: float
    economy_management: float
    communication_quality: float
    matches_played: int = 0
    wins: int = 0
    loss_streak: int = 0
    win_streak: int = 0

    class Config:
        from_attributes = True

# Resolve forward references
MatchResponse.model_rebuild()