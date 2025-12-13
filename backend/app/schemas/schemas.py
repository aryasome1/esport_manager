"""
Comprehensive Pydantic schemas for eSports Manager API
FIXED: Enums now match PostgreSQL values (lowercase).
FIXED: MatchResponse game_mode made flexible to prevent validation errors.
"""

from pydantic import BaseModel, Field, EmailStr, ConfigDict, validator
from typing import List, Optional, Dict, Any, Union, Generic, TypeVar
from datetime import datetime
from enum import Enum

# Import Enums from models
# Pastikan path import ini sesuai dengan struktur folder project kamu
from ..models.models import RoleType, CoachType, MatchStatus
# from ..models.division_models import DivisionType, ValorantAgent # Removed to avoid conflict, defining locally below

# --- ENUMS (Disamakan dengan PostgreSQL) ---
class DivisionType(str, Enum):
    MOBA = "moba"
    TACTICAL = "tactical"
    # Fallback/Legacy values
    VALORANT = "valorant" 

class ValorantAgent(str, Enum):
    # Definisi sesuai Enum DB (lowercase)
    JETT = "jett"
    RENA = "reyna"
    SAGE = "sage"
    SOVA = "sova"
    PHOENIX = "phoenix"
    BRIMSTONE = "brimstone"
    OMEN = "omen"
    CYPHER = "cypher"
    BREACH = "breach"
    VIPER = "viper"
    RAZE = "raze"
    KILLJOY = "killjoy"
    SKYE = "skye"
    YORU = "yoru"
    ASTRA = "astra"
    KAYO = "kayo"
    CHAMBER = "chamber"
    NEON = "neon"
    FADE = "fade"
    HARBOR = "harbor"
    GEKKO = "gekko"
    DEADLOCK = "deadlock"
    ISO = "iso"
    CLOVE = "clove"
    # Fallback generic
    DUELIST = "duelist"

class GameModeType(str, Enum):
    # [FIX] Values harus sama persis dengan yang ada di DB ('tournament', 'ranked')
    RANKED = "ranked"
    CASUAL = "casual"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"
    # Legacy mappings (biar aman kalau ada data lama)
    MOBA_5V5 = "5v5_draft"
    VALORANT_STD = "valorant_standard"
    STANDARD = "standard"

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
    division_preference: Optional[Union[DivisionType, str]] = "moba"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    division_preference: Optional[Union[DivisionType, str]] = None
    is_active: Optional[bool] = None

class User(UserBase, TimestampBase):
    id: int
    full_name: Optional[str] = None
    division_preference: Union[DivisionType, str] = "moba"
    team_id: Optional[int] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

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
    division_preference: Optional[Union[DivisionType, str]] = "moba"
    current_role: Optional[Union[RoleType, str]] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    current_role: Optional[Union[RoleType, str]] = None
    focus: Optional[float] = Field(None, ge=0.0, le=100.0)
    mental: Optional[float] = Field(None, ge=0.0, le=100.0)
    fatigue: Optional[float] = Field(None, ge=0.0, le=100.0)
    experience_level: Optional[int] = Field(None, ge=0)
    training_hours: Optional[int] = Field(None, ge=0)
    tactical_aim: Optional[float] = Field(None, ge=0.0, le=100.0)
    tactical_gamesense: Optional[float] = Field(None, ge=0.0, le=100.0)

class Player(PlayerBase, TimestampBase):
    id: int
    ovr: int = Field(default=50, ge=0, le=100)
    focus: float = Field(default=50.0, ge=0.0, le=100.0)
    mental: float = Field(default=50.0, ge=0.0, le=100.0)
    fatigue: float = Field(default=0.0, ge=0.0, le=100.0)
    current_role: Optional[Union[RoleType, str]] = None 
    team_id: Optional[int] = None
    experience_level: int = 1
    training_hours: int = 0
    division_preference: Optional[Union[DivisionType, str]] = "moba"
    
    moba_laning_skill: Optional[float] = 50.0
    moba_teamfight_presence: Optional[float] = 50.0
    tactical_aim: Optional[float] = 50.0
    tactical_gamesense: Optional[float] = 50.0
    
    is_active: bool = True

    # UI Computed Fields
    signature_hero_image: Optional[str] = None
    signature_hero_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- HEROES ---
class HeroBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    base_power: float = Field(default=50.0, ge=0.0, le=100.0)
    difficulty: int = Field(default=3, ge=1, le=5)
    role_specific: bool = False
    image_url: Optional[str] = None

class HeroCreate(HeroBase):
    preferred_lanes: List[Union[RoleType, str]] = []

class HeroUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    base_power: Optional[float] = Field(None, ge=0.0, le=100.0)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    preferred_lanes: Optional[List[Union[RoleType, str]]] = None
    image_url: Optional[str] = None

class Hero(HeroBase, TimestampBase):
    id: int
    preferred_lanes: List[Union[RoleType, str]] = []
    ban_count: int = 0

    model_config = ConfigDict(from_attributes=True)

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
    last_played: Optional[datetime] = None
    win_rate: float
    hero: Optional[Hero] = None

    model_config = ConfigDict(from_attributes=True)

class PlayerWithHeroStats(Player):
    hero_stats: List[HeroStatResponse] = []
    team: Optional["Team"] = None  
    
    model_config = ConfigDict(from_attributes=True)

class HeroWithStats(Hero):
    hero_stats: List[HeroStatResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

# --- TEAMS ---
class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    name_short: str = Field(..., min_length=2, max_length=10)
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#000000"
    secondary_color: Optional[str] = "#ffffff"
    division_id: Optional[int] = None

class TeamCreate(TeamBase):
    coach_id: Optional[int] = None
    division_type: Optional[Union[DivisionType, str]] = "moba"

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
    coach_id: Optional[int] = None
    is_player_controlled: bool = False
    players: List["Player"] = []

    model_config = ConfigDict(from_attributes=True)

TeamResponse = Team
HeroResponse = Hero

class TeamWithDetails(Team):
    coach: Optional[object] = None 

# --- COACHES ---
class CoachBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50)

class CoachCreate(CoachBase):
    password: str = Field(..., min_length=8)
    coach_type: Union[CoachType, str]
    experience_years: int = Field(default=0, ge=0)
    tactical_knowledge: float = Field(default=50.0, ge=0.0, le=100.0)

class CoachUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    coach_type: Optional[Union[CoachType, str]] = None
    experience_years: Optional[int] = Field(None, ge=0)
    tactical_knowledge: Optional[float] = Field(None, ge=0.0, le=100.0)
    motivational_impact: Optional[float] = Field(None, ge=-50.0, le=50.0)
    strategic_impact: Optional[float] = Field(None, ge=-50.0, le=50.0)

class Coach(CoachBase, TimestampBase):
    id: int
    coach_type: Union[CoachType, str]
    experience_years: int
    tactical_knowledge: float
    motivational_impact: float = 0.0
    strategic_impact: float = 0.0
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

CoachResponse = Coach

# --- MATCHES ---
class MatchBase(BaseModel):
    team1_id: int
    team2_id: int
    scheduled_at: datetime
    # [FIX] Allow flexible types to prevent Enum Validation Error
    game_mode: Optional[Union[GameModeType, str, int, Any]] = None 
    division_id: Optional[int] = None

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    status: Optional[Union[MatchStatus, str]] = None
    scheduled_at: Optional[datetime] = None
    played_at: Optional[datetime] = None
    team1_score: Optional[int] = Field(None, ge=0)
    team2_score: Optional[int] = Field(None, ge=0)
    winner_team_id: Optional[int] = None

class MatchResponse(MatchBase):
    id: int
    status: Union[MatchStatus, str] = "scheduled"
    scheduled_at: datetime
    played_at: Optional[datetime] = None
    team1_score: int = 0
    team2_score: int = 0
    winner_team_id: Optional[int] = None
    
    # Nested Relationships
    team1: Optional["Team"] = None
    team2: Optional["Team"] = None
    winner: Optional["Team"] = None
    draft_session: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

# --- DRAFT SYSTEM ---
class DraftSessionBase(BaseModel):
    match_id: int

class DraftSessionCreate(DraftSessionBase):
    pass

class DraftPickRequest(BaseModel):
    hero_id: int
    is_ban: bool = False
    role_assigned: Optional[Union[RoleType, str]] = None

class DraftPick(BaseModel):
    id: int
    hero_id: Optional[int] = None
    team_id: int
    is_ban: bool = False
    role_assigned: Optional[Union[RoleType, str]] = None
    turn_number: int

    model_config = ConfigDict(from_attributes=True)

class DraftSessionResponse(DraftSessionBase):
    id: int
    session_token: str
    phase: str
    current_team_id: Optional[int] = None
    ban_count_left: int
    turn_number: int
    max_turns: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_team: Optional["Team"] = None
    draft_picks: List[DraftPick] = []

    model_config = ConfigDict(from_attributes=True)

class DraftPickResponse(BaseModel):
    id: int
    hero_id: int
    team_id: int
    is_ban: bool
    role_assigned: Optional[Union[RoleType, str]]
    turn_number: int
    hero: Optional[Hero] = None
    team: Optional["Team"] = None
    
    model_config = ConfigDict(from_attributes=True)

class DraftState(BaseModel):
    session: DraftSessionResponse
    available_heroes: List[Hero]
    team1_lineup: Dict[str, int]
    team2_lineup: Dict[str, int]
    banned_heroes: List[int]

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

# --- VALORANT / TACTICAL ---
class AgentStatBase(BaseModel):
    player_id: int
    agent_name: Union[ValorantAgent, str]

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
    last_played: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

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
    favorite_agents: Optional[List[Union[ValorantAgent, str]]] = []

class MapStatResponse(MapStatBase):
    id: int
    avg_score: float = 0.0
    favorite_agents: List[Union[ValorantAgent, str]] = []

    model_config = ConfigDict(from_attributes=True)

class AgentResponse(BaseModel):
    id: int
    name: str
    role: str
    description: Optional[str] = None
    pick_rate: float = 0.0
    win_rate: float = 0.0
    difficulty: int = 1

    model_config = ConfigDict(from_attributes=True)

class MapResponse(BaseModel):
    id: int
    name: str
    map_type: str = "Standard"
    description: Optional[str] = None
    difficulty: int = 1
    pick_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class MatchMapResponse(BaseModel):
    id: int
    match_id: int
    map_id: int
    map_number: int
    map: MapResponse

    model_config = ConfigDict(from_attributes=True)

class TimeoutCallRequest(BaseModel):
    match_id: int
    team_id: int
    round_number: int
    timeout_duration: int = 60
    used_for: str = "tactical adjustment"

class ValorantMatchState(BaseModel):
    match_id: int
    current_map: int
    team1_agents: List[Union[ValorantAgent, str]] = []
    team2_agents: List[Union[ValorantAgent, str]] = []
    team1_score: int
    team2_score: int
    round_number: int
    timeout_calls_remaining: Dict[str, int] = {}

class AgentSelection(BaseModel):
    player_id: int
    agent: Union[ValorantAgent, str]
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

    model_config = ConfigDict(from_attributes=True)

# --- COMMON RESPONSES & GENERICS ---
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

# Generic Pagination
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool = False
    has_prev: bool = False

    model_config = ConfigDict(from_attributes=True)

# Resolve forward references
MatchResponse.model_rebuild()
PlayerWithHeroStats.model_rebuild()
TeamWithDetails.model_rebuild()