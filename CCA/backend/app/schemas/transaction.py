from datetime import datetime

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    receiver_email: str
    amount: float = Field(gt=0)


class TransactionOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    amount: float
    transaction_hash: str | None = None
    signature_verified: bool = False
    status: str
    fraud_score: float
    risk_level: str
    ai_summary: str
    created_at: datetime
    sender_name: str | None = None
    receiver_name: str | None = None

    model_config = {"from_attributes": True}


class FraudEvaluation(BaseModel):
    score: float
    risk_level: str
    reasons: list[str]
    recommendation: str
