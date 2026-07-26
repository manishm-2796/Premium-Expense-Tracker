from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import auth, categories, transactions, recurring, chat

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:8082"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(recurring.router)
app.include_router(chat.router)

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler import process_recurring_expenses

@app.on_event("startup")
async def start_scheduler():
    scheduler = AsyncIOScheduler()
    # Run every day at midnight (or every minute for testing)
    # We will run it every hour to ensure it catches due expenses
    scheduler.add_job(process_recurring_expenses, 'interval', hours=1)
    scheduler.start()
    
    # Run once on startup just to catch anything missed while offline
    asyncio.create_task(process_recurring_expenses())

@app.get("/")
def read_root():
    return {"message": "Welcome to Expense Tracker API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
