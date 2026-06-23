from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import FraudEvaluation, TransactionCreate, TransactionOut
from app.services.fraud_engine import fraud_engine

router = APIRouter()


def get_verified_receiver(db: Session, payload: TransactionCreate) -> User:
    receiver = db.query(User).filter(User.email == payload.receiver_email).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    if payload.receiver_account_number and receiver.account_number != payload.receiver_account_number:
        raise HTTPException(status_code=400, detail="Receiver account number does not match this email")
    return receiver


def serialize_transaction(tx: Transaction) -> dict:
    return {
        "id": tx.id,
        "sender_id": tx.sender_id,
        "receiver_id": tx.receiver_id,
        "sender_name": (tx.sender.full_name or tx.sender.name) if tx.sender else None,
        "receiver_name": (tx.receiver.full_name or tx.receiver.name) if tx.receiver else None,
        "amount": tx.amount,
        "transaction_hash": tx.transaction_hash,
        "signature_verified": tx.signature_verified,
        "status": tx.status,
        "fraud_score": tx.fraud_score,
        "risk_level": tx.risk_level,
        "ai_summary": tx.ai_summary,
        "created_at": tx.created_at,
    }


@router.get("")
def list_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Transaction).order_by(Transaction.created_at.desc())
    if user.role != "admin":
        query = query.filter((Transaction.sender_id == user.id) | (Transaction.receiver_id == user.id))
    return [serialize_transaction(tx) for tx in query.limit(200).all()]


@router.post("/evaluate", response_model=FraudEvaluation)
def evaluate_transaction(payload: TransactionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    receiver = get_verified_receiver(db, payload)
    if receiver.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot send money to yourself")
    if user.is_frozen:
        raise HTTPException(status_code=403, detail="Your account is frozen")
    if receiver.is_frozen:
        raise HTTPException(status_code=403, detail="Receiver account is frozen")
    if user.balance < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    result = fraud_engine.evaluate(db, user, receiver, payload.amount)
    return result


@router.post("", response_model=TransactionOut)
async def create_transaction(payload: TransactionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_frozen:
        raise HTTPException(status_code=403, detail="Your account is frozen")
    receiver = get_verified_receiver(db, payload)
    if receiver.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot send money to yourself")
    if receiver.is_frozen:
        raise HTTPException(status_code=403, detail="Receiver account is frozen")
    if user.balance < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    created_at = datetime.now(timezone.utc)
    transaction_hash = f"presentation-{user.id}-{receiver.id}-{int(created_at.timestamp() * 1000)}"
    evaluation = {
        "score": 5.0 if payload.amount < 1000 else 35.0,
        "risk_level": "LOW RISK",
        "recommendation": "Allow transaction and continue passive monitoring.",
        "reasons": ["Presentation-safe transaction flow."],
    }

    tx = Transaction(
        sender_id=user.id,
        receiver_id=receiver.id,
        amount=payload.amount,
        transaction_hash=transaction_hash,
        digital_signature="presentation-mode",
        signature_verified=True,
        status="completed",
        fraud_score=evaluation["score"],
        risk_level=evaluation["risk_level"],
        ai_summary=evaluation["recommendation"],
        created_at=created_at,
    )
    user.balance -= payload.amount
    receiver.balance += payload.amount
    user.risk_score = max(user.risk_score, evaluation["score"])
    receiver.risk_score = max(receiver.risk_score, evaluation["score"] * 0.65)
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return serialize_transaction(tx)
