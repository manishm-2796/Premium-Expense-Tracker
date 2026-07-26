from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate
from app.utils.security import (
    hash_password, verify_password, create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(email=user_data.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user)
    }

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.dob is not None:
        current_user.dob = user_update.dob
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.gemini_api_key is not None:
        current_user.gemini_api_key = user_update.gemini_api_key
    if user_update.card_last_four is not None:
        current_user.card_last_four = user_update.card_last_four
    if user_update.card_expiry is not None:
        current_user.card_expiry = user_update.card_expiry
    if user_update.daily_budget is not None:
        current_user.daily_budget = user_update.daily_budget
    if user_update.monthly_budget is not None:
        current_user.monthly_budget = user_update.monthly_budget
    if user_update.currency is not None:
        current_user.currency = user_update.currency
    if user_update.push_token is not None:
        current_user.push_token = user_update.push_token
        
    db.commit()
    db.refresh(current_user)
    return current_user
