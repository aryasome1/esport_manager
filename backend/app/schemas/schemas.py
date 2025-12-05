"""
Comprehensive Pydantic schemas for eSports Manager API
Request/response models for all entities and operations
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class RoleType(str, Enum):
    GOLDLANE = "goldlane"
    EXP_SU = "exp_su"
    MIDLANE = "midlane"
    JUNGLE = "jungle"
    ROAM = "roam"

class CoachType(str, Enum):
    MOTIVATOR = "motivator"
    STRATEGIST = "strategist"
    TOUGH_COACH = "tough_coach"
    FLEXIBLE_COACH = "flexible_coach"

class MatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    DRAFTING = "drafting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DraftPhase(str, Enum):
    WAITING = "waiting"
    BAN = "ban"
    PICK = "pick"
    COMPLETED = "completed"

class DivisionType(str, Enum):
    MOBA = "moba"
    VALORANT = "valorant"

class ValorantAgent(str, Enum):
    BREEZECALLER = "breach"
    SAGE = "sage"
    REYNA = "reyna"
    BREEZECALLER_AGENT = "breach"
    JETT = "jett"
    OMEGA = "omega"
    VIPER = "viper"
    PHOENIX = "phoenix"
    CYPHER = "cypher"
    KILLJOY = "killjoy"
    RAZE = "raze"
    SOVA = "sova"
    Brimstone = "brimstone"
    Yoru = "yoru"
    Astra = "astra"
    KAYO = "kayo"
    Neon = "neon"
    Fade = "fade"
    Harbor = "harbor"
    Skye = "skye"

class GameMode(str, Enum):
    COMPETITIVE = "competitive"
    UNRATED = "unrated"
    SPIKE_RUSH = "spike_rush"

# Base schemas
class TimestampBase(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class HeroPreferredLane(BaseModel):
    lane: RoleType
    preference_level: float = Field(default=1.0, ge=0.1, le=2.0)

# Authentication Schemas
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

# MOBA Player schemas
class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50)

class PlayerCreate(PlayerBase):
    password: str = Field(..., min_length=8)
    division_preference: Optional[DivisionType] = DivisionType.MOBA

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
    password_hash: str
    ovr: int = Field(..., ge=0, le=100)
    focus: float = Field(..., ge=0.0, le=100.0)
    mental: float = Field(..., ge=0.0, le=100.0)
    fatigue: float = Field(..., ge=0.0, le=100.0)
    current_role: Optional[RoleType]
    team_id: Optional[int]
    experience_level: int
    training_hours: int
    division_preference: DivisionType
    is_active: bool = True

    class Config:
        from_attributes = True

class PlayerWithHeroStats(Player):
    hero_stats: List = []
    team: Optional[object] = None

# Hero schemas (MOBA)
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

# Response alias for consistency
HeroResponse = Hero

class HeroWithStats(Hero):
    hero_stats: List = []

# Hero Stat schemas
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

# Team schemas
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
    division_type: DivisionType = DivisionType.MOBA

    class Config:
        from_attributes = True

# Response alias for consistency
TeamResponse = Team
HeroResponse = Hero

class TeamWithDetails(Team):
    players: List[object] = []
    coach: Optional[object] = None

# Coach schemas
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
    password_hash: str
    coach_type: CoachType
    experience_years: int
    tactical_knowledge: float
    motivational_impact: float = 0.0
    strategic_impact: float = 0.0
    is_active: bool = True

    class Config:
        from_attributes = True

# Response alias for consistency
CoachResponse = Coach

# Match schemas
class MatchBase(BaseModel):
    team1_id: int
    team2_id: int
    scheduled_at: datetime

class MatchCreate(MatchBase):
    game_mode: Optional[GameMode] = None

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
    game_mode: Optional[GameMode]
    team1: Team
    team2: Team
    winner: Optional[Team] = None
    draft_session: Optional[Any] = None  # Will be resolved later

    class Config:
        from_attributes = True

# Draft schemas
class DraftSessionBase(BaseModel):
    match_id: int

class DraftSessionCreate(DraftSessionBase):
    pass

class DraftPickRequest(BaseModel):
    hero_id: int
    is_ban: bool = False
    role_assigned: Optional[RoleType] = None

class DraftPickResponse(BaseModel):
    id: int
    hero_id: int
    team_id: int
    is_ban: bool
    role_assigned: Optional[RoleType]
    turn_number: int
    hero: Hero
    team: Team

# Training schemas
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

# Valorant Division schemas
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

# Add response aliases for Valorant division
class AgentResponse(BaseModel):
    """Agent response schema"""
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
    """Map response schema"""
    id: int
    name: str
    map_type: str
    description: Optional[str]
    difficulty: int
    pick_rate: float

    class Config:
        from_attributes = True

class MatchMapResponse(BaseModel):
    """Match map response schema"""
    id: int
    match_id: int
    map_id: int
    map_number: int
    map: MapResponse

    class Config:
        from_attributes = True

class TimeoutCallRequest(BaseModel):
    """Timeout call request schema"""
    match_id: int
    team_id: int
    round_number: int
    timeout_duration: int = 60  # Default 60 seconds
    used_for: str = "tactical adjustment"

class ValorantMatchState(BaseModel):
    """Valorant match state schema"""
    match_id: int
    current_map: int
    team1_agents: List[ValorantAgent]
    team2_agents: List[ValorantAgent]
    team1_score: int
    team2_score: int
    round_number: int
    timeout_calls_remaining: Dict[str, int]

class AgentSelection(BaseModel):
    """Agent selection schema"""
    player_id: int
    agent: ValorantAgent
    selection_order: int

class MapSelection(BaseModel):
    """Map selection schema"""
    map_name: str
    selection_order: int
    is_pick: bool

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

# Draft System Schemas
class DraftSessionBase(BaseModel):
    match_id: int

class DraftSessionCreate(DraftSessionBase):
    session_token: Optional[str] = None

class DraftState(BaseModel):
    phase: str
    current_team_id: Optional[int] = None
    ban_count_left: int = 3
    turn_number: int = 0
    max_turns: int = 20

class DraftPickRequest(BaseModel):
    hero_id: Optional[int] = None
    agent_name: Optional[ValorantAgent] = None
    is_ban: bool = False
    role_assigned: Optional[RoleType] = None

class DraftPick(BaseModel):
    id: int
    hero_id: Optional[int] = None
    agent_name: Optional[ValorantAgent] = None
    team_id: int
    is_ban: bool = False
    role_assigned: Optional[RoleType] = None
    turn_number: int

class DraftSessionResponse(DraftSessionBase):
    id: int
    session_token: str
    state: DraftState
    draft_picks: List[DraftPick] = []

    class Config:
        from_attributes = True

class DraftPickResponse(BaseModel):
    success: bool = False
    pick: Optional[DraftPick] = None
    current_state: Optional[DraftState] = None
    message: Optional[str] = None

# AI Opponent Schemas
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

# Analytics and reporting schemas
class TeamAnalytics(BaseModel):
    team_id: int
    team: TeamResponse
    player_stats: List['PlayerAnalytics'] = []
    draft_win_rate: float
    hero_ban_frequency: Dict[str, int]
    role_distribution: Dict[str, int]
    avg_team_chemistry: float
    recent_form: List[float]

class PlayerAnalytics(BaseModel):
    player_id: int
    player: Player
    total_matches: int
    win_rate: float
    best_hero: Optional[Hero]
    hero_specialization: List[Dict[str, Any]]
    performance_trend: List[float]
    current_form: float

class MatchAnalytics(BaseModel):
    total_matches: int
    avg_match_duration: float
    ban_pick_analysis: Dict[str, Any]
    team_composition_analysis: Dict[str, Any]
    most_picked_heroes: List[Hero]
    most_banned_heroes: List[Hero]
    win_rate_by_role: Dict[str, float]

# AI Opponent schemas
class AIProfileBase(BaseModel):
    difficulty_level: int = Field(..., ge=1, le=10)
    aggression_level: float = Field(..., ge=0.0, le=1.0)
    strategic_style: str = Field(..., pattern="^(aggressive|defensive|balanced|opportunistic)$")

class AIProfileCreate(AIProfileBase):
    name: str = Field(..., min_length=1, max_length=50)

class AIProfileUpdate(BaseModel):
    difficulty_level: Optional[int] = Field(None, ge=1, le=10)
    aggression_level: Optional[float] = Field(None, ge=0.0, le=1.0)
    strategic_style: Optional[str] = Field(None, pattern="^(aggressive|defensive|balanced|opportunistic)$")
    match_count: Optional[int] = Field(None, ge=0)
    win_rate: Optional[float] = Field(None, ge=0.0, le=100.0)

class AIProfileResponse(AIProfileBase):
    id: int
    name: str
    match_count: int = 0
    win_rate: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

# WebSocket schemas
class DraftUpdate(BaseModel):
    type: str  # "pick", "ban", "phase_change"
    payload: Dict[str, Any]

class MatchUpdate(BaseModel):
    type: str  # "match_start", "match_end", "score_update"
    match_id: int
    payload: Dict[str, Any]

class TeamUpdateMessage(BaseModel):
    type: str  # "player_update", "team_composition_change"
    team_id: int
    payload: Dict[str, Any]

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Response wrappers
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

# Update forward references
TeamAnalytics.update_forward_refs()
PlayerAnalytics.update_forward_refs()

# Resolve forward references
MatchResponse.model_rebuild()