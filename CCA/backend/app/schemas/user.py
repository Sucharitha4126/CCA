from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    full_name: str | None = None
    email: EmailStr
    phone_number: str | None
    address: str | None = None
    dob: date | None = None
    account_number: str | None
    ifsc_code: str | None = None
    bank_name: str | None = None
    branch_name: str | None = None
    account_type: str | None = None
    pan_number: str | None = None
    role: str
    balance: float
    risk_score: float
    is_frozen: bool
    signature_enabled: bool = True
    public_key: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
