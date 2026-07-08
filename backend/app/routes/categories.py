from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Category
from app.schemas.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from app.utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    return categories

@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_category = Category(
        user_id=current_user.id,
        name=category_data.name,
        color=category_data.color,
        budget_limit=category_data.budget_limit
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category_data.name:
        category.name = category_data.name
    if category_data.color:
        category.color = category_data.color
    if category_data.budget_limit is not None:
        category.budget_limit = category_data.budget_limit
    
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
