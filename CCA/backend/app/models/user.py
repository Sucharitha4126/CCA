from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    branch_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    account_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    public_key: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    encrypted_private_key: Mapped[str | None] = mapped_column(String(8192), nullable=True)
    digital_identity: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    balance: Mapped[float] = mapped_column(Float, default=25000)
    risk_score: Mapped[float] = mapped_column(Float, default=12)
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    signature_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_id", back_populates="sender")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_id", back_populates="receiver")
