from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import json
from datetime import datetime
import os
import logging

from app.models.models import Receipt, Transaction, Category, User
from app.utils.security import get_current_user
from app.services.receipt_service import ReceiptOCRService
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/receipts", tags=["receipts"])

def get_receipt_service():
    return ReceiptOCRService(api_key=os.getenv("GEMINI_API_KEY", ""))

@router.post("/process")
async def process_receipt(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process receipt image and extract transaction details.
    """
    try:
        if "image" in data:
            image_base64 = data["image"]
        elif "image_url" in data:
            import requests
            response = requests.get(data["image_url"])
            image_base64 = base64.b64encode(response.content).decode()
        else:
            raise HTTPException(status_code=400, detail="image or image_url required")
        
        # User API Key override if set
        api_key = current_user.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        service = ReceiptOCRService(api_key=api_key)
        
        result = await service.process_receipt(image_base64, current_user.id)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        extracted = result["data"]
        items_str = json.dumps(extracted.get("items", [])) if extracted.get("items") else "[]"
        
        # Save receipt record (pending review)
        receipt = Receipt(
            user_id=current_user.id,
            merchant=extracted.get("merchant", "Unknown Merchant"),
            amount=float(extracted.get("amount", 0.0)),
            currency=extracted.get("currency", current_user.currency or "USD"),
            date=extracted.get("date", datetime.now().strftime("%Y-%m-%d")),
            time=extracted.get("time"),
            category=extracted.get("category", "Other"),
            items=items_str,
            image_url=image_base64[:100] + "..." if len(image_base64) > 100 else image_base64,
            confidence=float(extracted.get("confidence", 0.8)),
            status="pending_review",
            extraction_method=extracted.get("extraction_method", "gemini")
        )
        
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        return {
            "success": True,
            "receipt_id": receipt.id,
            "data": {
                "merchant": receipt.merchant,
                "amount": receipt.amount,
                "currency": receipt.currency,
                "date": receipt.date,
                "category": receipt.category,
                "items": json.loads(receipt.items) if receipt.items else [],
                "confidence": receipt.confidence,
                "extraction_method": receipt.extraction_method
            },
            "requires_review": receipt.confidence < 0.85
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Receipt processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Receipt processing failed: {str(e)}")


@router.post("/confirm/{receipt_id}")
async def confirm_receipt(
    receipt_id: int,
    confirmed_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm receipt and convert to permanent transaction.
    """
    try:
        receipt = db.query(Receipt).filter(
            Receipt.id == receipt_id,
            Receipt.user_id == current_user.id
        ).first()
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        cat_name = confirmed_data.get("category", receipt.category)
        category = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.name == cat_name
        ).first()
        
        if not category:
            category = Category(user_id=current_user.id, name=cat_name, color="#6366f1")
            db.add(category)
            db.commit()
            db.refresh(category)
            
        merchant_name = confirmed_data.get("merchant", receipt.merchant)
        amount_val = float(confirmed_data.get("amount", receipt.amount))
        date_str = confirmed_data.get("date", receipt.date)
        
        try:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            parsed_date = datetime.utcnow()

        transaction = Transaction(
            user_id=current_user.id,
            category_id=category.id,
            amount=amount_val,
            description=f"Receipt: {merchant_name}",
            date=parsed_date,
            source="ocr"
        )
        
        receipt.status = "confirmed"
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction.id,
            "message": "Transaction created successfully from receipt!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Receipt confirmation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Confirmation failed: {str(e)}")


@router.get("/")
async def get_receipts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get user's receipt history."""
    receipts = db.query(Receipt).filter(
        Receipt.user_id == current_user.id
    ).order_by(Receipt.created_at.desc()).limit(limit).all()
    
    return {
        "receipts": [
            {
                "id": r.id,
                "merchant": r.merchant,
                "amount": r.amount,
                "currency": r.currency,
                "date": r.date,
                "category": r.category,
                "status": r.status,
                "confidence": r.confidence
            } for r in receipts
        ]
    }
