from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import engine
from app.models.user import User


def _add_missing(table_name: str, column_sql: dict[str, str]):
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    statements = []
    for column, sql_type in column_sql.items():
        if column not in columns:
            statements.append(f"ALTER TABLE {table_name} ADD COLUMN {column} {sql_type}")
    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_schema_columns():
    _add_missing(
        "users",
        {
            "full_name": "VARCHAR(120)",
            "phone_number": "VARCHAR(30)",
            "address": "VARCHAR(255)",
            "dob": "DATE",
            "account_number": "VARCHAR(40)",
            "ifsc_code": "VARCHAR(20)",
            "bank_name": "VARCHAR(120)",
            "branch_name": "VARCHAR(120)",
            "account_type": "VARCHAR(20)",
            "pan_number": "VARCHAR(20)",
            "balance": "DOUBLE PRECISION DEFAULT 0",
            "password": "VARCHAR(255)",
            "password_hash": "VARCHAR(255)",
            "public_key": "VARCHAR(4096)",
            "encrypted_private_key": "VARCHAR(8192)",
            "digital_identity": "VARCHAR(128)",
            "failed_login_attempts": "INTEGER DEFAULT 0",
            "signature_enabled": "BOOLEAN DEFAULT TRUE",
        },
    )
    _add_missing(
        "transactions",
        {
            "transaction_hash": "VARCHAR(128)",
            "digital_signature": "TEXT",
            "signature_verified": "BOOLEAN DEFAULT FALSE",
        },
    )


def ensure_user_security_columns():
    ensure_schema_columns()


def ensure_digital_signature_identities():
    from app.db.session import SessionLocal
    from app.services.signature_service import signature_service

    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(
                User.account_number.isnot(None),
                ((User.public_key.is_(None)) | (User.encrypted_private_key.is_(None))),
            )
            .all()
        )
        for user in users:
            identity = signature_service.generate_identity(user.email, user.account_number or str(user.id))
            user.public_key = identity["public_key"]
            user.encrypted_private_key = identity["encrypted_private_key"]
            user.digital_identity = identity["digital_identity"]
        if users:
            db.commit()
    finally:
        db.close()


def ensure_default_admin_user():
    from app.db.session import SessionLocal
    from app.services.signature_service import signature_service

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()
        if admin:
            if admin.role != "admin":
                admin.role = "admin"
                db.commit()
            return

        password_hash = hash_password(settings.DEFAULT_ADMIN_PASSWORD)
        identity = signature_service.generate_identity(settings.DEFAULT_ADMIN_EMAIL, "SP-900001")
        db.add(
            User(
                name="Kavach Admin",
                full_name="Kavach Admin",
                email=settings.DEFAULT_ADMIN_EMAIL,
                phone_number="+91 98765 00000",
                address="Kavach administrator account",
                account_number="SP-900001",
                ifsc_code="SNPY0001234",
                bank_name="Kavach Trust Bank",
                branch_name="Digital Banking Branch",
                account_type="Current",
                pan_number="KAVAC9001H",
                public_key=identity["public_key"],
                encrypted_private_key=identity["encrypted_private_key"],
                digital_identity=identity["digital_identity"],
                password=password_hash,
                password_hash=password_hash,
                role="admin",
                balance=120000,
                risk_score=8,
            )
        )
        db.commit()
    finally:
        db.close()
