from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.services.graph_service import graph_service

router = APIRouter()


@router.get("")
def graph_payload(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return graph_service.visualization_payload(db)


@router.get("/analysis")
def graph_analysis(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return graph_service.analyze(db)
