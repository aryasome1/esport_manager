"""
Authentication Router
Handles Login, Register, Logout, and User Profile (Me)
FIXED: 
- Login endpoint now properly handles JSON Body for React Native.
- Removed strict dependency on OAuth2PasswordRequestForm to fix 422 Error.
- Implemented dual-mode login (JSON or Form Data).
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Any, Dict, Optional

from ..database import get_db
from ..models.models import User, Team
from ..schemas.schemas import UserCreate, User as UserSchema, Token, UserLogin # Pastikan UserLogin ada di schemas
from ..utils.auth_utils import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    print(f"--> [BACKEND] Register Request Received: {user_data.email}")
    
    try:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_password = get_password_hash(user_data.password)
        
        starter_team = db.query(Team).filter(Team.id == 5).first()
        team_id_to_assign = 5 if starter_team else None

        new_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            division_preference=user_data.division_preference,
            password_hash=hashed_password,
            team_id=team_id_to_assign 
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.email}, expires_delta=access_token_expires
        )
        
        user_response = UserSchema.model_validate(new_user)
        
        return {
            "user": user_response,
            "access_token": access_token,
            "token_type": "bearer"
        }

    except IntegrityError as e:
        db.rollback()
        print(f"--> [BACKEND] DB Error: {e}")
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except Exception as e:
        db.rollback()
        print(f"--> [BACKEND] Register Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# [CRITICAL FIX] Login Endpoint yang Fleksibel
@router.post("/login", response_model=Token)
async def login_for_access_token(
    # Kita buat parameter opsional agar Pydantic tidak marah kalau salah satu kosong
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(lambda: None), 
    login_data: Optional[UserLogin] = Body(None), # Ambil dari JSON Body
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login. 
    Accepts EITHER Form Data (Swagger) OR JSON Body (React Native).
    """
    email = None
    password = None

    # 1. Cek apakah request berupa JSON Body (Priority 1 - React Native)
    if login_data:
        print(f"--> [BACKEND] Login via JSON: {login_data.email}")
        email = login_data.email
        password = login_data.password
    
    # 2. Cek apakah request berupa Form Data (Priority 2 - Swagger UI)
    # Note: OAuth2 spec uses 'username' field for email
    elif form_data:
        print(f"--> [BACKEND] Login via Form: {form_data.username}")
        email = form_data.username 
        password = form_data.password

    if not email or not password:
         raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and Password are required (JSON or Form Data)",
        )

    user = authenticate_user(db, email, password)
    if not user:
        print("--> [BACKEND] Login Failed: Invalid Credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    print("--> [BACKEND] Login Success")
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    return {"message": "Successfully logged out"}