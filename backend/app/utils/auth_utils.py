"""
Authentication utilities for eSports Manager
JWT token handling, password hashing, and user verification
FIXED: Added missing functions (get_user_id_from_token) and Dependency Injection
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

# Import database dependency
from ..database import get_db

# Configure logging
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

class AuthenticationError(Exception):
    """Custom exception for authentication errors"""
    pass

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise AuthenticationError("Failed to hash password")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error(f"JWT encoding error: {e}")
        raise AuthenticationError("Failed to create access token")

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: Dict[str, Any]) -> str:
    expires_delta = timedelta(days=30)
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "refresh"})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error(f"Refresh token creation error: {e}")
        raise AuthenticationError("Failed to create refresh token")

# --- RESTORED UTILITY FUNCTIONS ---

def get_user_id_from_token(token: str) -> Optional[str]:
    """Extract user ID from token without full validation"""
    try:
        payload = decode_token(token)
        if payload:
            return payload.get("sub")
        return None
    except Exception:
        return None

# Token Blacklist Storage (Simple In-Memory)
token_blacklist = set()

def blacklist_token(token: str):
    token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    return token in token_blacklist

def verify_token_with_blacklist(token: str) -> Optional[Dict[str, Any]]:
    """Verify token and check if it is blacklisted"""
    if is_token_blacklisted(token):
        return None
    return decode_token(token)

# --- DEPENDENCY INJECTION FUNCTIONS ---

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user from token
    """
    from ..models.models import User
    from ..schemas.schemas import TokenData
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        # Check blacklist first
        if is_token_blacklisted(token):
            raise credentials_exception
            
        payload = decode_token(token)
        if payload is None:
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=int(user_id))
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

# [FIX] Dependency Injection Corrected
def get_current_active_user(
    current_user = Depends(get_current_user)
):
    """
    Get current active user (ensures user is active)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

async def verify_websocket_token(websocket):
    """
    Verify WebSocket token
    """
    try:
        token = websocket.query_params.get("token")
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Check blacklist
        if is_token_blacklisted(token):
            raise HTTPException(status_code=401, detail="Token blacklisted")

        payload = decode_token(token)
        if payload is None:
             raise HTTPException(status_code=401, detail="Invalid token")

        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token content")
        
        # Return simple object for WebSocket usage
        class SimpleUser:
            def __init__(self, id):
                self.id = id
        
        return SimpleUser(user_id)
        
    except Exception as e:
        logger.error(f"WebSocket token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")