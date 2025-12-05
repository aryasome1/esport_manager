"""
Main FastAPI application for eSports Multi-Division Manager
Supports both MOBA and Tactical Shooter (Valorant) divisions
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from .database import SessionLocal, engine
from .models.models import Base
from .models.division_models import DivisionType
from .routers import auth, players, heroes, teams, coaches, matches, draft, training
from .routers import divisions, valorant, ai_opponents, valorant_api, moba_api
from .services.draft_service import DraftService
from .services.valorant_service import ValorantMatchService
from .services.ai_opponent_service import AdaptiveAIOpponent
from .services.websocket_manager import WebSocketManager

# Load environment variables
load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

# WebSocket manager for real-time updates
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 eSports Multi-Division Manager API starting up...")
    print("📱 Supporting Multiple Divisions:")
    print("  • MOBA Division (Mobile Legends style)")
    print("  • Tactical Shooter Division (Valorant style)")
    
    await websocket_manager.connect()
    
    # Initialize division data
    # await initialize_divisions()  # Disabled for now to avoid circular dependency issues
    
    yield
    # Shutdown
    print("🔄 Shutting down eSports Multi-Division Manager API...")
    await websocket_manager.disconnect()

async def initialize_divisions():
    """Initialize default divisions and game modes"""
    from .models.division_models import Division
    
    db = SessionLocal()
    try:
        # Check if divisions already exist
        existing_divisions = db.query(Division).count()
        if existing_divisions == 0:
            print("🆕 Creating default divisions...")
            await create_default_divisions(db)
    finally:
        db.close()

async def create_default_divisions(db):
    """Create default divisions and game modes"""
    from .models.division_models import Division, GameMode
    
    # Create MOBA Division
    moba_division = Division(
        name="MOBA Division",
        division_type=DivisionType.MOBA,
        description="Mobile Legends style MOBA gameplay with 5v5 team composition and hero drafting",
        max_players_per_team=5,
        min_players_per_team=5,
        team_roles='["Goldlane", "Exp Lane", "Midlane", "Jungle", "Roam"]',
        has_draft_system=True,
        has_timeout_system=False,
        has_agent_selection=False,
        has_map_pool=False,
        has_ai_opponent=False,
        primary_color="#10B981",
        secondary_color="#6366F1"
    )
    
    # Create Tactical Division
    tactical_division = Division(
        name="Tactical Shooter Division",
        division_type=DivisionType.TACTICAL,
        description="Valorant style tactical shooter with agent selection, map control, and adaptive AI",
        max_players_per_team=5,
        min_players_per_team=5,
        team_roles='["Duelist", "Controller", "Initiator", "Sentinel", "Flex"]',
        has_draft_system=False,
        has_timeout_system=True,
        has_agent_selection=True,
        has_map_pool=True,
        has_ai_opponent=True,
        primary_color="#8B5CF6",
        secondary_color="#F59E0B"
    )
    
    db.add_all([moba_division, tactical_division])
    db.commit()
    
    # Create game modes for each division
    # MOBA Game Modes
    from .models.division_models import GameMode
    moba_modes = [
        GameMode(
            division_id=moba_division.id,
            name="Ranked MOBA",
            game_mode_type="ranked",
            max_players=10,
            duration_minutes=25,
            requires_draft=True,
            allows_timeout=False,
            supports_ai_opponent=False
        ),
        GameMode(
            division_id=moba_division.id,
            name="Casual MOBA",
            game_mode_type="casual",
            max_players=10,
            duration_minutes=20,
            requires_draft=False,
            allows_timeout=False,
            supports_ai_opponent=True
        )
    ]
    
    # Tactical Game Modes
    tactical_modes = [
        GameMode(
            division_id=tactical_division.id,
            name="Ranked Tactical",
            game_mode_type="ranked",
            max_players=10,
            duration_minutes=45,
            requires_draft=False,
            allows_timeout=True,
            supports_ai_opponent=False
        ),
        GameMode(
            division_id=tactical_division.id,
            name="Tactical vs AI",
            game_mode_type="practice",
            max_players=5,
            duration_minutes=40,
            requires_draft=False,
            allows_timeout=True,
            supports_ai_opponent=True
        ),
        GameMode(
            division_id=tactical_division.id,
            name="Tournament Tactical",
            game_mode_type="tournament",
            max_players=10,
            duration_minutes=50,
            requires_draft=False,
            allows_timeout=True,
            supports_ai_opponent=False
        )
    ]
    
    db.add_all(moba_modes + tactical_modes)
    db.commit()
    
    print("✅ Default divisions and game modes created")

# Initialize FastAPI app
app = FastAPI(
    title="eSports Multi-Division Manager API",
    description="Comprehensive eSports management system supporting MOBA and Tactical Shooter divisions",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(divisions.router, prefix="/api/divisions", tags=["Divisions"])
app.include_router(players.router, prefix="/api/players", tags=["Players"])
app.include_router(heroes.router, prefix="/api/heroes", tags=["Heroes"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(coaches.router, prefix="/api/coaches", tags=["Coaches"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(draft.router, prefix="/api/draft", tags=["Draft System"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])

# MOBA specific routers
app.include_router(moba_api.router, prefix="/api/moba", tags=["MOBA API"])

# Valorant/Tactical Shooter specific routers
app.include_router(valorant.router, prefix="/api/valorant", tags=["Valorant Division"])
app.include_router(valorant_api.router, prefix="/api/valorant", tags=["Valorant API"])
app.include_router(ai_opponents.router, prefix="/api/ai-opponents", tags=["AI Opponents"])

# WebSocket endpoints
@app.websocket("/ws/draft/{session_token}")
async def draft_websocket(websocket, session_token: str):
    await websocket_manager.connect_draft_session(websocket, session_token)

@app.websocket("/ws/match/{match_id}")
async def match_websocket(websocket, match_id: int):
    await websocket_manager.connect_match(websocket, match_id)

@app.websocket("/ws/valorant/{match_id}")
async def valorant_websocket(websocket, match_id: int):
    await websocket_manager.connect_valorant_match(websocket, match_id)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "eSports Multi-Division Manager",
        "divisions": ["MOBA", "Tactical Shooter"],
        "features": {
            "moba_division": {
                "hero_drafting": True,
                "timeout_system": False,
                "ai_opponent": False
            },
            "tactical_division": {
                "agent_selection": True,
                "map_pool": True,
                "timeout_system": True,
                "adaptive_ai": True
            }
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to eSports Multi-Division Manager API",
        "version": "2.0.0",
        "divisions": {
            "moba": "Mobile Legends style MOBA gameplay",
            "tactical": "Valorant style tactical shooter"
        },
        "features": {
            "multi_division": "Support for multiple eSports game types",
            "real_time_matching": "Live draft and match updates",
            "adaptive_ai": "AI opponents that learn and adapt",
            "comprehensive_stats": "Detailed player and team analytics"
        },
        "docs": "/docs"
    }

# Division-specific endpoints
@app.get("/api/divisions/{division_type}/status")
async def get_division_status(division_type: str):
    """Get current status of a specific division"""
    if division_type.lower() == "moba":
        return {
            "division": "MOBA Division",
            "status": "active",
            "players_online": 156,
            "active_matches": 12,
            "features": {
                "hero_drafting": True,
                "coach_system": True,
                "training_system": True
            }
        }
    elif division_type.lower() == "tactical":
        return {
            "division": "Tactical Shooter Division", 
            "status": "active",
            "players_online": 203,
            "active_matches": 18,
            "features": {
                "agent_selection": True,
                "map_pool": True,
                "timeout_system": True,
                "adaptive_ai": True
            }
        }
    else:
        raise HTTPException(status_code=404, detail="Division not found")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
