from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def write_audit(
    db: Session,
    event_type: str,
    message: str,
    user_id: int | None = None,
    severity: str = "info",
    request: Request | None = None,
):
    ip_address = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None
    log = AuditLog(
        user_id=user_id,
        event_type=event_type,
        severity=severity,
        ip_address=ip_address,
        user_agent=user_agent,
        message=message,
    )
    db.add(log)
    db.commit()
    return log
