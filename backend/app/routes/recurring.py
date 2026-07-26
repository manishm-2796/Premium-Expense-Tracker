from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, RecurringExpense
from app.schemas.schemas import RecurringExpenseCreate, RecurringExpenseUpdate, RecurringExpenseResponse
from app.utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/recurring", tags=["recurring"])

@router.get("/", response_model=List[RecurringExpenseResponse])
def get_recurring_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expenses = db.query(RecurringExpense).filter(RecurringExpense.user_id == current_user.id).all()
    return expenses

@router.post("/", response_model=RecurringExpenseResponse)
def create_recurring_expense(
    expense_data: RecurringExpenseCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_expense = RecurringExpense(
        user_id=current_user.id,
        merchant=expense_data.merchant,
        amount=expense_data.amount,
        frequency=expense_data.frequency,
        next_date=expense_data.next_date
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.put("/{expense_id}", response_model=RecurringExpenseResponse)
def update_recurring_expense(
    expense_id: int,
    expense_data: RecurringExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.id == expense_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    if expense_data.merchant is not None:
        expense.merchant = expense_data.merchant
    if expense_data.amount is not None:
        expense.amount = expense_data.amount
    if expense_data.frequency is not None:
        expense.frequency = expense_data.frequency
    if expense_data.next_date is not None:
        expense.next_date = expense_data.next_date
    
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}")
def delete_recurring_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.id == expense_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    db.delete(expense)
    db.commit()
    return {"message": "Recurring expense deleted"}
