"""
Database configuration and session management for eSports Manager
"""

import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database configuration from environment variables
DB_CONNECTION = os.getenv("DB_CONNECTION", "sqlite")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_DATABASE = os.getenv("DB_DATABASE", "esport_manager")
DB_USERNAME = os.getenv("DB_USERNAME", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "aryaaaaa")

# Construct database URL based on connection type
if DB_CONNECTION.lower() == "pgsql":
    DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"
else:
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./esport_manager.db"

# Create database engine with connection pooling
if "postgresql" in DATABASE_URL:
    # PostgreSQL-specific configuration
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,  # Set to True for SQL query logging
        connect_args={
            "connect_timeout": 60,
            "application_name": "eSports Manager API"
        }
    )
else:
    # SQLite-specific configuration
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,  # Set to True for SQL query logging
        connect_args={"check_same_thread": False}
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Event listener to log slow queries
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set SQLite-specific settings for better performance"""
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    Use this in FastAPI route dependencies
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def create_tables():
    """
    Create all database tables
    Call this once at application startup
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def drop_tables():
    """
    Drop all database tables
    Use this for development/testing
    """
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise

def get_database_url() -> str:
    """Get the current database URL"""
    return DATABASE_URL

def health_check() -> bool:
    """
    Check if database is accessible
    Returns True if connection is successful
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Connection pool events
@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    """Log when a connection is established"""
    logger.info(f"Database connection established: {connection_record.info}")

@event.listens_for(engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool"""
    logger.debug(f"Connection checked out from pool: {connection_record.info}")

@event.listens_for(engine, "checkin")
def checkin(dbapi_connection, connection_record):
    """Log when a connection is returned to the pool"""
    logger.debug(f"Connection returned to pool: {connection_record.info}")

# Test database creation
if __name__ == "__main__":
    # Create tables for testing
    create_tables()
    print("Database initialized successfully!")
    
    # Test connection
    if health_check():
        print("Database connection is healthy!")
    else:
        print("Database connection failed!")