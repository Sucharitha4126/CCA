from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.admin import AnalyticsOut, FreezeRequest
from app.schemas.user import UserOut

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsOut)
def analytics(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    total = len(transactions)
    fraud_count = len([tx for tx in transactions if tx.risk_level in {"MEDIUM RISK", "HIGH RISK"}])
    volume = sum(tx.amount for tx in transactions)
    avg_risk = round(sum(tx.fraud_score for tx in transactions) / total, 2) if total else 0
    distribution = {"LOW RISK": 0, "MEDIUM RISK": 0, "HIGH RISK": 0}
    for tx in transactions:
        distribution[tx.risk_level] = distribution.get(tx.risk_level, 0) + 1
    suspicious_accounts = db.query(User).filter((User.risk_score >= 45) | (User.is_frozen.is_(True))).count()
    frozen_accounts = db.query(User).filter(User.is_frozen.is_(True)).count()
    high_value_accounts = db.query(User).filter(User.balance >= 75000).count()
    suspicious_balance_changes = (
        db.query(Transaction)
        .join(User, Transaction.sender_id == User.id)
        .filter((Transaction.risk_level == "HIGH RISK") | (Transaction.amount >= 0.4 * User.balance))
        .count()
    )
    total_customer_balance = float(db.query(func.coalesce(func.sum(User.balance), 0)).scalar() or 0)
    return AnalyticsOut(
        total_transactions=total,
        fraud_count=fraud_count,
        suspicious_accounts=suspicious_accounts,
        frozen_accounts=frozen_accounts,
        high_value_accounts=high_value_accounts,
        suspicious_balance_changes=suspicious_balance_changes,
        total_customer_balance=total_customer_balance,
        volume=volume,
        average_risk=avg_risk,
        risk_distribution=distribution,
    )


@router.get("/users", response_model=list[UserOut])
def users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/freeze", response_model=UserOut)
def freeze_user(user_id: int, payload: FreezeRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts cannot be frozen")
    user.is_frozen = payload.is_frozen
    db.commit()
    db.refresh(user)
    return user


@router.get("/alerts")
def alerts(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(FraudAlert).order_by(FraudAlert.created_at.desc()).limit(100).all()


@router.get("/activity-logs")
def activity_logs(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    by_day = (
        db.query(func.date(Transaction.created_at).label("day"), func.count(Transaction.id), func.sum(Transaction.amount))
        .group_by(func.date(Transaction.created_at))
        .all()
    )
    return [{"day": str(day), "transactions": count, "volume": float(volume or 0)} for day, count, volume in by_day]
