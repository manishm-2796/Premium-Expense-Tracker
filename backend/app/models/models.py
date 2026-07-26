from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    gemini_api_key = Column(String, nullable=True)
    card_last_four = Column(String, nullable=True)
    card_expiry = Column(String, nullable=True)
    daily_budget = Column(Float, default=0.0) # Deprecated
    monthly_budget = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    push_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    recurring_expenses = relationship("RecurringExpense", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    color = Column(String, default="#3498db")
    budget_limit = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    amount = Column(Float)
    original_amount = Column(Float, nullable=True)
    original_currency = Column(String, nullable=True)
    exchange_rate = Column(Float, nullable=True)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    source = Column(String, default="manual")  # "manual" or "csv"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class RecurringExpense(Base):
    __tablename__ = "recurring"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    merchant = Column(String)
    amount = Column(Float)
    frequency = Column(String, default="Monthly") # Monthly, Weekly, Yearly
    next_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="recurring_expenses")
