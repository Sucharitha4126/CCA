import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.signature_service import signature_service

router = APIRouter()
logger = logging.getLogger("sentinelpay.auth")


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    logger.warning("Registration request received for %s from %s", payload.email, request.client.host if request.client else "unknown")
    try:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email is already registered")
        account_exists = db.query(User).filter(User.account_number == payload.account_number).first()
        if account_exists:
            raise HTTPException(status_code=409, detail="Account number is already registered")
        pan_exists = db.query(User).filter(User.pan_number == payload.pan_number.upper()).first()
        if pan_exists:
            raise HTTPException(status_code=409, detail="PAN number is already registered")
        password_hash = hash_password(payload.password)
        identity = signature_service.generate_identity(payload.email, payload.account_number)
        user = User(
            name=payload.full_name,
            full_name=payload.full_name,
            email=payload.email,
            phone_number=payload.phone_number,
            address=payload.address,
            dob=payload.dob,
            account_number=payload.account_number,
            ifsc_code=payload.ifsc_code.upper(),
            bank_name=payload.bank_name,
            branch_name=payload.branch_name,
            account_type=payload.account_type,
            pan_number=payload.pan_number.upper(),
            public_key=identity["public_key"],
            encrypted_private_key=identity["encrypted_private_key"],
            digital_identity=identity["digital_identity"],
            password=password_hash,
            password_hash=password_hash,
            balance=payload.initial_balance,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(user.email, user.role)
        logger.warning("Registration succeeded for user_id=%s email=%s balance=%s", user.id, user.email, user.balance)
        return TokenResponse(access_token=token, role=user.role)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Registration failed for %s", payload.email)
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")


async def _read_login_payload(request: Request) -> LoginRequest:
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        return LoginRequest(email=form.get("username", ""), password=form.get("password", ""))
    body = await request.json()
    return LoginRequest(**body)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    payload = await _read_login_payload(request)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.email, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.post("/token", response_model=TokenResponse)
def swagger_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.email, user.role)
    return TokenResponse(access_token=token, role=user.role)
