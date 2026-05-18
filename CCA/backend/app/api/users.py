from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/balance")
def balance(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_sent = (
        db.query(Transaction)
        .filter(Transaction.sender_id == user.id, Transaction.status == "completed")
        .with_entities(Transaction.amount)
        .all()
    )
    total_received = (
        db.query(Transaction)
        .filter(Transaction.receiver_id == user.id, Transaction.status == "completed")
        .with_entities(Transaction.amount)
        .all()
    )
    return {
        "balance": user.balance,
        "available_balance": 0 if user.is_frozen else user.balance,
        "total_sent": sum(row.amount for row in total_sent),
        "total_received": sum(row.amount for row in total_received),
        "risk_score": user.risk_score,
        "is_frozen": user.is_frozen,
    }


@router.get("/alerts")
def my_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = (
        db.query(FraudAlert)
        .filter(FraudAlert.user_id == user.id)
        .order_by(FraudAlert.created_at.desc())
        .limit(20)
        .all()
    )
    return alerts


@router.get("/activity")
def my_activity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = (
        db.query(Transaction)
        .filter((Transaction.sender_id == user.id) | (Transaction.receiver_id == user.id))
        .order_by(Transaction.created_at.desc())
        .limit(20)
        .all()
    )
    return transactions
