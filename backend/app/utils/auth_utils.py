"""
Authentication utilities for eSports Manager
JWT token handling, password hashing, and user verification
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import WebSocket
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
# Switch to pbkdf2_sha256 to avoid bcrypt backend/version issues and 72-byte limit
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class AuthenticationError(Exception):
    """Custom exception for authentication errors"""
    pass

class AuthorizationError(Exception):
    """Custom exception for authorization errors"""
    pass

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hash a plain password
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise AuthenticationError("Failed to hash password")

def create_access_token(
    data: Dict[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Custom expiration time (optional)
        
    Returns:
        Encoded JWT token
    """
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

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token to verify
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token and return payload
    
    Args:
        token: JWT token to decode
        
    Returns:
        Token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a JWT token
    
    Args:
        token: JWT token
        
    Returns:
        Expiration datetime or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.utcfromtimestamp(exp_timestamp)
        return None
    except JWTError:
        return None

def is_token_expired(token: str) -> bool:
    """
    Check if a JWT token is expired
    
    Args:
        token: JWT token to check
        
    Returns:
        True if expired, False otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.utcnow() > datetime.utcfromtimestamp(exp_timestamp)
        return True  # If no expiration, treat as expired
    except JWTError:
        return True

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token
    
    Args:
        token: JWT token
        
    Returns:
        User ID or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return user_id
    except JWTError:
        return None

def get_user_email_from_token(token: str) -> Optional[str]:
    """
    Extract user email from JWT token
    
    Args:
        token: JWT token
        
    Returns:
        User email or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("email")
        return user_email
    except JWTError:
        return None

def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a refresh token with longer expiration
    
    Args:
        data: Data to encode in the token
        
    Returns:
        Encoded refresh token
    """
    expires_delta = timedelta(days=30)  # 30 days for refresh token
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error(f"Refresh token creation error: {e}")
        raise AuthenticationError("Failed to create refresh token")

def validate_token_type(token: str, expected_type: str) -> bool:
    """
    Validate token type (access vs refresh)
    
    Args:
        token: JWT token
        expected_type: Expected token type
        
    Returns:
        True if token type matches, False otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        return token_type == expected_type
    except JWTError:
        return False

def authenticate_user(db_session, email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user with email and password
    
    Args:
        db_session: Database session
        email: User email
        password: Plain password
        
    Returns:
        User data if authenticated, None otherwise
    """
    try:
        # This would need to be implemented with actual User model
        # For now, this is a placeholder function
        from ..models.models import User  # Would need to be imported when exists
        
        user = db_session.query(User).filter(User.email == email).first()
        if user and verify_password(password, user.hashed_password):
            return {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "division_preference": user.division_preference
            }
        return None
    except Exception as e:
        logger.error(f"User authentication error: {e}")
        return None

def create_user_session_data(user_id: str, email: str, username: str) -> Dict[str, Any]:
    """
    Create session data for token generation
    
    Args:
        user_id: User ID
        email: User email
        username: User username
        
    Returns:
        Session data dictionary
    """
    return {
        "sub": user_id,
        "email": email,
        "username": username,
        "iat": datetime.utcnow(),
        "type": "access"
    }

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user from token
    """
    from ..models.models import User
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
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

def get_current_active_user(current_user):
    """
    Get current active user (ensures user is active)
    """
    from ..models.models import User
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

async def verify_websocket_token(websocket):
    """
    Verify WebSocket token for draft sessions
    """
    try:
        # Get token from WebSocket connection
        token = websocket.query_params.get("token")
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Verify token
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_id
        
    except Exception as e:
        logger.error(f"WebSocket token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")

# Token blacklisting (for logout functionality)
# In a production environment, you might want to implement token blacklisting
# This is a simple in-memory implementation - use Redis for production
token_blacklist = set()

def blacklist_token(token: str):
    """
    Add a token to the blacklist (logout)
    
    Args:
        token: JWT token to blacklist
    """
    token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted
    
    Args:
        token: JWT token to check
        
    Returns:
        True if blacklisted, False otherwise
    """
    return token in token_blacklist

def verify_token_with_blacklist(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a token considering blacklist
    
    Args:
        token: JWT token to verify
        
    Returns:
        Decoded payload or None if invalid/blacklisted
    """
    if is_token_blacklisted(token):
        return None
    
    return verify_token(token)

if __name__ == "__main__":
    # Test functions
    print("Testing authentication utilities...")
    
    # Test password hashing
    test_password = "test123"
    hashed = get_password_hash(test_password)
    print(f"Password hash: {hashed}")
    
    # Test password verification
    is_valid = verify_password(test_password, hashed)
    print(f"Password verification: {is_valid}")
    
    # Test token creation
    user_data = create_user_session_data("123", "test@example.com", "testuser")
    access_token = create_access_token(user_data)
    print(f"Access token: {access_token}")
    
    # Test token verification
    decoded = decode_token(access_token)
    print(f"Decoded token: {decoded}")
    
    # Test expiration check
    is_expired = is_token_expired(access_token)
    print(f"Token expired: {is_expired}")