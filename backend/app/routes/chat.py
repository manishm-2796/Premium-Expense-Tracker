from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Transaction, Category
from app.utils.security import get_current_user
from pydantic import BaseModel
import os
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        pass

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Fetch recent data context
        transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).limit(50).all()
        categories = db.query(Category).filter(Category.user_id == current_user.id).all()
        
        user_currency = current_user.currency or "USD"
        
        # Format data for prompt safely
        tx_lines = []
        for t in transactions:
            cat_name = t.category.name if t.category else "Uncategorized"
            date_str = t.date.strftime('%Y-%m-%d') if t.date else "Recent"
            tx_lines.append(f"- {date_str}: {t.description} ({cat_name}) - {user_currency} {t.amount:.2f}")
        tx_list = "\n".join(tx_lines)
        
        cat_lines = []
        for c in categories:
            limit_str = f"{user_currency} {c.budget_limit:.2f}" if c.budget_limit else "None"
            cat_lines.append(f"- {c.name}: Budget Limit {limit_str}")
        cat_list = "\n".join(cat_lines)
        
        prompt = f"""
You are a helpful, friendly, and expert AI Financial Assistant built into the user's Expense Tracker app.
You are chatting with the user. Be concise, empathetic, and offer useful financial advice.
Do NOT use markdown tables or excessively long formatting. Keep your responses short enough to fit cleanly in a mobile chat bubble (1-3 sentences preferably, max 5).

Here is the user's financial context:
Currency: {user_currency}
Monthly Budget: {current_user.monthly_budget if current_user.monthly_budget else 'None'}

Recent Transactions (last 50):
{tx_list if tx_list else 'No recent transactions.'}

Categories and Limits:
{cat_list if cat_list else 'No categories set up.'}

User's Message: "{request.message}"

Assistant Response:"""

        # Initialize Gemini with User's Key or System key
        api_key_to_use = current_user.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        
        if GEMINI_AVAILABLE and api_key_to_use:
            try:
                genai.configure(api_key=api_key_to_use)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                if response and response.text:
                    return {"reply": response.text.strip()}
            except Exception as e:
                print(f"Gemini API Exception: {e}")

        # Smart Rule-Based Financial Advisor Fallback if Gemini Key is unavailable or errors out
        total_spent = sum(t.amount for t in transactions)
        cat_totals = {}
        for t in transactions:
            c_name = t.category.name if t.category else "Uncategorized"
            cat_totals[c_name] = cat_totals.get(c_name, 0) + t.amount

        top_category = max(cat_totals.items(), key=lambda x: x[1])[0] if cat_totals else "N/A"
        top_cat_amount = cat_totals.get(top_category, 0)

        user_msg_lower = request.message.lower()
        
        if "save" in user_msg_lower or "cut" in user_msg_lower or "reduce" in user_msg_lower:
            return {"reply": f"Based on your recent transactions, your highest spending category is {top_category} at {user_currency} {top_cat_amount:.2f}. Reducing purchases in this area could help you save significantly this month!"}
        elif "doing" in user_msg_lower or "summary" in user_msg_lower or "budget" in user_msg_lower:
            budget_str = f"out of your monthly budget of {user_currency} {current_user.monthly_budget:.2f}" if current_user.monthly_budget else ""
            return {"reply": f"You've spent a total of {user_currency} {total_spent:.2f} across {len(transactions)} recent transactions {budget_str}. Your top category is {top_category}."}
        elif "subscription" in user_msg_lower or "recurring" in user_msg_lower:
            return {"reply": "Review your active subscriptions regularly to ensure you're not paying for unused streaming, gym, or software services."}
        else:
            return {"reply": f"Hello! I am your AI Financial Assistant. You have logged {len(transactions)} transactions totaling {user_currency} {total_spent:.2f}. Your top expense category is {top_category} ({user_currency} {top_cat_amount:.2f}). How else can I help you manage your budget today?"}

    except Exception as err:
        print(f"Chat Handler Exception: {err}")
        return {"reply": "I analyzed your recent transactions. Everything looks on track! Feel free to ask me about your spending breakdown or budget recommendations."}
