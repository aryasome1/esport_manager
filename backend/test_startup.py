#!/usr/bin/env python3
"""
Test script to verify all backend components can be imported and initialized
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test that all critical components can be imported"""
    try:
        print("Testing database imports...")
        from app.database import engine, SessionLocal, get_db
        print("✅ Database module imported successfully")
        
        print("Testing model imports...")
        from app.models.models import Base, Player, Hero, Team, Coach, Match, DraftSession
        from app.models.division_models import Division, GameMode, AgentStat, MapStat, AIOpponent
        print("✅ All model classes imported successfully")
        
        print("Testing utility imports...")
        from app.utils.auth_utils import verify_password, get_password_hash, create_access_token
        print("✅ Auth utilities imported successfully")
        
        print("Testing schema imports...")
        from app.schemas.schemas import UserCreate, PlayerCreate, TeamCreate, HeroCreate
        print("✅ Schema classes imported successfully")
        
        print("Testing service imports...")
        from app.services.draft_service import DraftService
        from app.services.valorant_service import ValorantMatchService
        from app.services.ai_opponent_service import AdaptiveAIOpponent
        from app.services.websocket_manager import WebSocketManager
        print("✅ All service classes imported successfully")
        
        print("Testing router imports...")
        from app.routers import auth_router, players_router, heroes_router, teams_router
        from app.routers import coaches_router, matches_router, draft_router, training_router
        from app.routers import divisions_router, valorant_router, ai_opponents_router
        print("✅ All router modules imported successfully")
        
        print("\n🎉 All backend components imported successfully!")
        print("The backend application should be ready to run.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    try:
        from app.database import engine, create_tables
        from app.database import health_check
        
        print("\nTesting database connection...")
        
        # Create tables
        create_tables()
        print("✅ Database tables created successfully")
        
        # Test health check
        if health_check():
            print("✅ Database connection is healthy")
        else:
            print("❌ Database connection failed")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Testing eSports Manager Backend Components")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed. Please check for missing dependencies.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    
    # Test database
    if not test_database_connection():
        print("\n❌ Database tests failed. Please check database configuration.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ All tests passed! Backend is ready to run.")
    print("\nTo start the backend server, run:")
    print("  cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")