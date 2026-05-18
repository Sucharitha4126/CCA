from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    digital_signature: Mapped[str | None] = mapped_column(Text, nullable=True)
    signature_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="completed")
    fraud_score: Mapped[float] = mapped_column(Float, default=0)
    risk_level: Mapped[str] = mapped_column(String(30), default="LOW RISK")
    ai_summary: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_transactions")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_transactions")
