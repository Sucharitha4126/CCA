from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.core.security import hash_password
from app.db.migrations import ensure_schema_columns
from app.db.session import Base, SessionLocal, engine
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.models.user import User
from app.services.signature_service import signature_service


def demo_user(name, email, phone, account, signature_seed, password_hash, **extra):
    identity = signature_service.generate_identity(email, account)
    return User(
        name=name,
        full_name=name,
        email=email,
        phone_number=phone,
        address=extra.pop("address", "Demo banking address"),
        dob=extra.pop("dob", None),
        account_number=account,
        ifsc_code=extra.pop("ifsc_code", "SNPY0001234"),
        bank_name=extra.pop("bank_name", "Kavach Trust Bank"),
        branch_name=extra.pop("branch_name", "Digital Banking Branch"),
        account_type=extra.pop("account_type", "Savings"),
        pan_number=extra.pop("pan_number", f"SP{account[-6:]}PAN"),
        digital_identity=identity["digital_identity"],
        public_key=identity["public_key"],
        encrypted_private_key=identity["encrypted_private_key"],
        password=password_hash,
        password_hash=password_hash,
        **extra,
    )


def seed():
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    db = SessionLocal()
    db.query(FraudAlert).delete()
    db.query(Transaction).delete()
    db.query(User).delete()

    admin_hash = hash_password("Admin@123")
    user_hash = hash_password("User@123")
    users = [
        demo_user("Ava Morgan", "admin@sentinelpay.io", "+1 415 555 0101", "SP-900001", "Ava-Secure-2026", admin_hash, role="admin", balance=120000, risk_score=8, account_type="Current", pan_number="AVAMO9001P"),
        demo_user("Maya Shah", "maya@sentinelpay.io", "+91 98765 43001", "SP-100245", "Maya-Secure-2026", user_hash, balance=52000, risk_score=18, pan_number="MAYAS0245P"),
        demo_user("Arjun Mehta", "arjun@sentinelpay.io", "+91 98765 43002", "SP-100246", "Arjun-Secure-2026", user_hash, balance=41000, risk_score=22, pan_number="ARJUN0246P"),
        demo_user("Nora Patel", "nora@sentinelpay.io", "+91 98765 43003", "SP-100247", "Nora-Secure-2026", user_hash, balance=29000, risk_score=62, pan_number="NORAP0247P"),
        demo_user("Leo Banks", "leo@sentinelpay.io", "+1 212 555 0133", "SP-100248", "Leo-Secure-2026", user_hash, balance=87000, risk_score=73, is_frozen=True, account_type="Current", pan_number="LEOBK0248P"),
        demo_user("Isha Rao", "isha@sentinelpay.io", "+91 98765 43004", "SP-100249", "Isha-Secure-2026", user_hash, balance=33000, risk_score=47, pan_number="ISHAR0249P"),
        demo_user("Zane Cross", "zane@sentinelpay.io", "+1 646 555 0188", "SP-100250", "Zane-Secure-2026", user_hash, balance=15000, risk_score=81, pan_number="ZANEC0250P"),
    ]
    db.add_all(users)
    db.commit()
    for user in users:
        db.refresh(user)

    by_email = {user.email: user for user in users}
    now = datetime.now(timezone.utc)
    rows = [
        ("maya@sentinelpay.io", "arjun@sentinelpay.io", 1250, 12, "LOW RISK", -9),
        ("arjun@sentinelpay.io", "isha@sentinelpay.io", 2800, 18, "LOW RISK", -8),
        ("isha@sentinelpay.io", "maya@sentinelpay.io", 1750, 44, "MEDIUM RISK", -7),
        ("nora@sentinelpay.io", "leo@sentinelpay.io", 9600, 56, "MEDIUM RISK", -5),
        ("zane@sentinelpay.io", "leo@sentinelpay.io", 15400, 86, "HIGH RISK", -4),
        ("isha@sentinelpay.io", "leo@sentinelpay.io", 7200, 67, "MEDIUM RISK", -3),
        ("maya@sentinelpay.io", "nora@sentinelpay.io", 500, 21, "LOW RISK", -2),
        ("nora@sentinelpay.io", "zane@sentinelpay.io", 3000, 72, "HIGH RISK", -1),
        ("zane@sentinelpay.io", "maya@sentinelpay.io", 3100, 79, "HIGH RISK", 0),
    ]
    transactions = []
    for sender_email, receiver_email, amount, score, level, hour_offset in rows:
        tx = Transaction(
            sender_id=by_email[sender_email].id,
            receiver_id=by_email[receiver_email].id,
            amount=amount,
            fraud_score=score,
            risk_level=level,
            status="review" if level == "HIGH RISK" else "completed",
            ai_summary="Seeded fraud scenario for dashboard demonstration.",
            created_at=now + timedelta(hours=hour_offset),
        )
        transactions.append(tx)
    db.add_all(transactions)
    db.commit()

    for tx in db.query(Transaction).filter(Transaction.risk_level != "LOW RISK").all():
        db.add(
            FraudAlert(
                user_id=tx.sender_id,
                transaction_id=tx.id,
                alert_type=tx.risk_level,
                severity="critical" if tx.risk_level == "HIGH RISK" else "warning",
                message="Suspicious transfer pattern detected in sample dataset.",
                created_at=tx.created_at,
            )
        )
    db.commit()
    db.close()
    print("Seed data created.")


if __name__ == "__main__":
    seed()
