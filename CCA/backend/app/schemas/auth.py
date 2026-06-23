from datetime import date

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone_number: str = Field(min_length=8, max_length=30)
    address: str = Field(min_length=8, max_length=255)
    dob: date
    account_number: str = Field(min_length=6, max_length=40)
    ifsc_code: str = Field(min_length=4, max_length=20)
    bank_name: str = Field(min_length=2, max_length=120)
    branch_name: str = Field(min_length=2, max_length=120)
    account_type: str
    initial_balance: float = Field(ge=0)
    pan_number: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, value: str) -> str:
        normalized = value.strip().title()
        if normalized not in {"Savings", "Current"}:
            raise ValueError("Account type must be Savings or Current")
        return normalized

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info):
        if info.data.get("password") != value:
            raise ValueError("Passwords do not match")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
