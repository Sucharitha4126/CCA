from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api import admin, auth, graph, transactions, users, websocket
from app.core.config import settings
from app.core.errors import rate_limit_handler
from app.db.migrations import ensure_schema_columns
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)
ensure_schema_columns()

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Cloud transaction monitoring and AI fraud detection API",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth.router, tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(graph.router, prefix="/api/graph", tags=["Graph"])
app.include_router(websocket.router, prefix="/ws", tags=["Realtime"])


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}
