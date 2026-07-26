import logging
from datetime import datetime, timedelta
import httpx
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import RecurringExpense, Transaction, Category, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def send_push_notification(token: str, title: str, body: str):
    if not token:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": token,
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "data": {"type": "subscription_charge"}
                }
            )
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")

def get_or_create_sub_category(db: Session, user_id: int):
    cat = db.query(Category).filter(Category.user_id == user_id, Category.name == "Subscriptions").first()
    if not cat:
        cat = Category(user_id=user_id, name="Subscriptions", color="#8b5cf6")
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat

async def process_recurring_expenses():
    logger.info("Running automated subscription engine...")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due_expenses = db.query(RecurringExpense).filter(RecurringExpense.next_date <= now).all()
        
        for exp in due_expenses:
            user = db.query(User).filter(User.id == exp.user_id).first()
            if not user:
                continue
                
            cat = get_or_create_sub_category(db, user.id)
            
            # Create transaction
            tx = Transaction(
                user_id=user.id,
                category_id=cat.id,
                amount=exp.amount,
                original_amount=exp.amount,
                original_currency=user.currency,
                exchange_rate=1.0,
                description=f"Auto-charge: {exp.merchant}",
                date=now,
                source="auto-recurring"
            )
            db.add(tx)
            
            # Update next date
            if exp.frequency == "Weekly":
                exp.next_date = exp.next_date + timedelta(days=7)
            elif exp.frequency == "Yearly":
                exp.next_date = exp.next_date.replace(year=exp.next_date.year + 1)
            else: # Monthly
                month = exp.next_date.month
                year = exp.next_date.year
                if month == 12:
                    month = 1
                    year += 1
                else:
                    month += 1
                try:
                    exp.next_date = exp.next_date.replace(year=year, month=month)
                except ValueError:
                    # Handle end of month edge cases (e.g. Jan 31 -> Feb 28)
                    exp.next_date = exp.next_date.replace(year=year, month=month, day=28)
            
            db.commit()
            
            # Send Push Notification
            if user.push_token:
                await send_push_notification(
                    user.push_token,
                    "Subscription Charged! 💳",
                    f"{exp.merchant} was automatically charged {user.currency} {exp.amount:.2f}."
                )
                
    except Exception as e:
        logger.error(f"Error in process_recurring_expenses: {e}")
        db.rollback()
    finally:
        db.close()
