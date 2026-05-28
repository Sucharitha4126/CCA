from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Kavach RiskOps"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DATABASE_URL: str = "sqlite:///./sentinelpay.db"
    FRONTEND_URL: str = "http://localhost:5173"
    NEO4J_URI: str | None = None
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str | None = None
    HIGH_VALUE_THRESHOLD: float = 10000
    RAPID_TRANSFER_WINDOW_MINUTES: int = 10
    RAPID_TRANSFER_LIMIT: int = 4
    SLACK_WEBHOOK_URL: str | None = None
    ALERT_EMAIL_ENABLED: bool = True
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    ALERT_FROM_EMAIL: str | None = None
    ALERT_TO_EMAIL: str | None = "sucharitha4126@gmail.com"
    OUTGOING_WEBHOOK_URL: str | None = None
    ALERT_HTTP_TIMEOUT_SECONDS: float = 5.0
    ALERT_COOLDOWN_SECONDS: int = 300
    DEFAULT_ADMIN_EMAIL: str = "admin@sentinelpay.io"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
