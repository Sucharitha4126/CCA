from pydantic import BaseModel


class FreezeRequest(BaseModel):
    is_frozen: bool


class AnalyticsOut(BaseModel):
    total_transactions: int
    fraud_count: int
    suspicious_accounts: int
    frozen_accounts: int
    high_value_accounts: int
    suspicious_balance_changes: int
    total_customer_balance: float
    volume: float
    average_risk: float
    risk_distribution: dict[str, int]
