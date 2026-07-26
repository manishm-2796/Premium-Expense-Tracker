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

class SocialLoginRequest(BaseModel):
    provider: str
    email: EmailStr
    full_name: Optional[str] = None
    token: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    gemini_api_key: Optional[str] = None
    card_last_four: Optional[str] = None
    card_expiry: Optional[str] = None
    daily_budget: float
    monthly_budget: Optional[float] = None
    currency: str
    push_token: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    gemini_api_key: Optional[str] = None
    card_last_four: Optional[str] = None
    card_expiry: Optional[str] = None
    daily_budget: Optional[float] = None
    monthly_budget: Optional[float] = None
    currency: Optional[str] = None
    push_token: Optional[str] = None

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
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None
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
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None
    exchange_rate: Optional[float] = None
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
    monthly_budget: Optional[float] = None
    by_category: dict
    month: str

# Recurring Expense Schemas
class RecurringExpenseCreate(BaseModel):
    merchant: str
    amount: float
    frequency: str = "Monthly"
    next_date: datetime

class RecurringExpenseUpdate(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    next_date: Optional[datetime] = None

class RecurringExpenseResponse(BaseModel):
    id: int
    merchant: str
    amount: float
    frequency: str
    next_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token Schema
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
