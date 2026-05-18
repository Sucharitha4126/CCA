from sqlalchemy import inspect, text

from app.db.session import engine


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
