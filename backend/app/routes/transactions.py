from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
import csv
import requests
import re
import base64
from io import StringIO, BytesIO
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.database import get_db
from app.models.models import User, Transaction, Category
from app.schemas.schemas import TransactionCreate, TransactionUpdate, TransactionResponse, DashboardSummary
from app.utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/transactions", tags=["transactions"])

def auto_categorize(description: str) -> str:
    keywords = {
        "Coffee": ["STARBUCKS", "COFFEE", "CAFE", "NESCAFE", "DUNKIN"],
        "Groceries": ["WALMART", "WHOLE FOODS", "KROGER", "COSTCO", "TRADER JOE", "SAFEWAY"],
        "Gas": ["SHELL", "CHEVRON", "EXXON", "BP", "ARCO"],
        "Food": ["RESTAURANT", "PIZZA", "BURGER", "MCDONALDS", "UBER EATS", "DOORDASH", "CHIPOTLE"],
        "Shopping": ["AMAZON", "TARGET", "BESTBUY"],
        "Utilities": ["ELECTRIC", "WATER", "GAS BILL", "INTERNET", "COMCAST", "AT&T"],
    }
    desc_upper = str(description).upper()
    for category, keywords_list in keywords.items():
        if any(keyword in desc_upper for keyword in keywords_list):
            return category
    return "Other"

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    try:
        df = pd.read_csv(BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid CSV format")
    
    date_col = next((c for c in df.columns if 'date' in c.lower()), None)
    amount_col = next((c for c in df.columns if 'amount' in c.lower() or 'cost' in c.lower() or 'price' in c.lower()), None)
    desc_col = next((c for c in df.columns if 'desc' in c.lower() or 'name' in c.lower() or 'payee' in c.lower()), None)
    
    if not all([date_col, amount_col, desc_col]):
        raise HTTPException(status_code=400, detail="CSV must contain Date, Amount, and Description columns")
        
    created_count = 0
    for idx, row in df.iterrows():
        try:
            amount = float(str(row[amount_col]).replace('$', '').replace(',', '').strip())
            date_val = pd.to_datetime(row[date_col]).to_pydatetime()
            desc = str(row[desc_col])
            
            cat_name = auto_categorize(desc)
            category = db.query(Category).filter(Category.user_id == current_user.id, Category.name == cat_name).first()
            if not category:
                category = Category(user_id=current_user.id, name=cat_name, color="#8b5cf6")
                db.add(category)
                db.flush()
                
            new_transaction = Transaction(
                user_id=current_user.id,
                category_id=category.id,
                amount=amount,
                description=desc,
                date=date_val,
                source="csv"
            )
            db.add(new_transaction)
            created_count += 1
        except Exception as e:
            print(f"Skipping row {idx}: {e}")
            continue
            
    db.commit()
    return {"message": f"Successfully imported {created_count} transactions"}

@router.get("/export-csv")
def export_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Category", "Amount", "Source"])
    
    for t in transactions:
        writer.writerow([t.date.strftime("%Y-%m-%d"), t.description, t.category.name, t.amount, t.source])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    category_id: int = Query(None),
    month: str = Query(None),  # Format: "2025-01"
    search: str = Query(None)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    
    if month:
        # Filter by month: "2025-01"
        year, mon = month.split("-")
        query = query.filter(
            (Transaction.date >= f"{year}-{mon}-01") &
            (Transaction.date < f"{year}-{int(mon)+1:02d}-01")
        )
    
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    
    return query.order_by(Transaction.date.desc()).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify category belongs to user
    category = db.query(Category).filter(
        Category.id == transaction_data.category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    new_transaction = Transaction(
        user_id=current_user.id,
        category_id=transaction_data.category_id,
        amount=transaction_data.amount,
        description=transaction_data.description,
        date=transaction_data.date,
        source="manual"
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction_data.category_id:
        transaction.category_id = transaction_data.category_id
    if transaction_data.amount:
        transaction.amount = transaction_data.amount
    if transaction_data.description:
        transaction.description = transaction_data.description
    if transaction_data.date:
        transaction.date = transaction_data.date
    
    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted"}

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    month: str = Query(None)  # Format: "2025-01"
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if month:
        year, mon = month.split("-")
        query = query.filter(
            (Transaction.date >= f"{year}-{mon}-01") &
            (Transaction.date < f"{year}-{int(mon)+1:02d}-01")
        )
    
    transactions = query.all()
    
    # Calculate totals
    total_spent = sum(t.amount for t in transactions)
    
    # Calculate today's spent
    today = datetime.now().date()
    today_spent = sum(t.amount for t in transactions if t.date.date() == today)
    
    # Group by category
    by_category = {}
    for transaction in transactions:
        cat_name = transaction.category.name
        by_category[cat_name] = by_category.get(cat_name, 0) + transaction.amount
    
    return {
        "total_spent": total_spent,
        "today_spent": today_spent,
        "daily_budget": current_user.daily_budget,
        "by_category": by_category,
        "month": month or datetime.now().strftime("%Y-%m")
    }

@router.post("/scan")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    
    # 1. Encode image to Base64
    b64_image = base64.b64encode(contents).decode('utf-8')
    data_uri = f"data:{file.content_type};base64,{b64_image}"
    
    # 2. Call OCR.space API
    # Free API key 'helloworld' has rate limits but works for testing/MVP
    response = requests.post(
        "https://api.ocr.space/parse/image",
        data={
            "apikey": "helloworld",
            "base64Image": data_uri,
            "language": "eng",
            "isOverlayRequired": False
        }
    )
    
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="OCR Service Unavailable")
        
    result = response.json()
    if result.get("IsErroredOnProcessing"):
        raise HTTPException(status_code=400, detail="Failed to parse image text")
        
    parsed_results = result.get("ParsedResults", [])
    if not parsed_results:
        raise HTTPException(status_code=400, detail="No text found in image")
        
    text = parsed_results[0].get("ParsedText", "")
    
    # 3. Extract Amount
    # Find all currency patterns like $12.99 or 12.99
    amounts = re.findall(r'[$€£]?\s*(\d+\.\d{2})', text)
    amounts = [float(a) for a in amounts]
    total_amount = max(amounts) if amounts else 0.0
    
    # 4. Extract Date (simple pattern mm/dd/yyyy or yyyy-mm-dd)
    date_str = None
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if date_match:
        try:
            # Attempt basic parse
            dt = pd.to_datetime(date_match.group(1), errors='coerce')
            if not pd.isna(dt):
                date_str = dt.strftime("%Y-%m-%d")
        except:
            pass
            
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
        
    return {
        "amount": total_amount,
        "date": date_str,
        "raw_text": text[:200] # Return snippet for debugging if needed
    }
