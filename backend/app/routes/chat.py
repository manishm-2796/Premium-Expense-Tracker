from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Transaction, Category
from app.utils.security import get_current_user
from pydantic import BaseModel
import os
import google.generativeai as genai

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Try to configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent data context
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).limit(50).all()
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    
    # Format data for prompt
    tx_list = "\n".join([f"- {t.date.strftime('%Y-%m-%d')}: {t.description} ({t.category.name}) - {current_user.currency} {t.amount:.2f}" for t in transactions])
    cat_list = "\n".join([f"- {c.name}: Budget Limit {current_user.currency} {c.budget_limit if c.budget_limit else 'None'}" for c in categories])
    
    prompt = f"""
You are a helpful, friendly, and expert AI Financial Assistant built into the user's Expense Tracker app.
You are chatting with the user. Be concise, empathetic, and offer useful financial advice.
Do NOT use markdown tables or excessively long formatting. Keep your responses short enough to fit cleanly in a mobile chat bubble (1-3 sentences preferably, max 5).

Here is the user's financial context:
Currency: {current_user.currency}
Monthly Budget: {current_user.monthly_budget if current_user.monthly_budget else 'None'}

Recent Transactions (last 50):
{tx_list if tx_list else 'No recent transactions.'}

Categories and Limits:
{cat_list if cat_list else 'No categories set up.'}

User's Message: "{request.message}"

Assistant Response:"""

    # Initialize Gemini with User's Key or System key
    api_key_to_use = current_user.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    
    if api_key_to_use:
        try:
            genai.configure(api_key=api_key_to_use)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API Exception: {e}")

    # Smart Rule-Based Financial Advisor Fallback if no Gemini Key available
    total_spent = sum(t.amount for t in transactions)
    cat_totals = {}
    for t in transactions:
        cat_name = t.category.name if t.category else "Uncategorized"
        cat_totals[cat_name] = cat_totals.get(cat_name, 0) + t.amount

    top_category = max(cat_totals.items(), key=lambda x: x[1])[0] if cat_totals else "N/A"
    top_cat_amount = cat_totals.get(top_category, 0)

    user_msg_lower = request.message.lower()
    
    if "save" in user_msg_lower or "cut" in user_msg_lower or "reduce" in user_msg_lower:
        return {"reply": f"Based on your recent transactions, your highest spending category is {top_category} at {current_user.currency} {top_cat_amount:.2f}. Reducing purchases in this area could help you save significantly this month!"}
    elif "doing" in user_msg_lower or "summary" in user_msg_lower or "budget" in user_msg_lower:
        budget_str = f"out of your monthly budget of {current_user.currency} {current_user.monthly_budget:.2f}" if current_user.monthly_budget else ""
        return {"reply": f"You've spent a total of {current_user.currency} {total_spent:.2f} across {len(transactions)} recent transactions {budget_str}. Your top category is {top_category}."}
    elif "subscription" in user_msg_lower or "recurring" in user_msg_lower:
        return {"reply": "Review your active subscriptions regularly to ensure you're not paying for unused streaming, gym, or software services."}
    else:
        return {"reply": f"Hello! I am your AI Financial Assistant. You have logged {len(transactions)} transactions totaling {current_user.currency} {total_spent:.2f}. Your top expense category is {top_category} ({current_user.currency} {top_cat_amount:.2f}). How else can I help you manage your budget today?"}
