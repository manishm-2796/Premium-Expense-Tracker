from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    daily_budget: float
    currency: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    daily_budget: Optional[float] = None
    currency: Optional[str] = None

# Category Schemas
class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#3498db"
    budget_limit: Optional[float] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    budget_limit: Optional[float] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    budget_limit: Optional[float]
    
    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionCreate(BaseModel):
    category_id: int
    amount: float
    description: str
    date: datetime

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: int
    amount: float
    description: str
    date: datetime
    source: str
    category: CategoryResponse
    
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_spent: float
    today_spent: float
    daily_budget: float
    by_category: dict
    month: str

# Token Schema
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
