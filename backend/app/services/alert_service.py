import asyncio
import html
import logging
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HighRiskTransactionAlert:
    """Serializable alert context for a high-risk transaction."""

    transaction_id: str
    amount: float
    risk_score: float
    risk_level: str
    sender: str
    receiver: str
    timestamp: datetime
    indicators: list[str]

    @property
    def severity(self) -> str:
        if self.risk_score >= 95:
            return "critical"
        return "high"

    def webhook_payload(self) -> dict[str, Any]:
        return {
            "event": "high_risk_transaction",
            "transaction_id": self.transaction_id,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "severity": self.severity,
            "amount": self.amount,
            "sender": self.sender,
            "receiver": self.receiver,
            "timestamp": self.timestamp.isoformat(),
            "indicators": self.indicators,
        }


class AlertService:
    """Dispatch high-risk fraud alerts to Slack, email, webhooks, and dashboards."""

    def __init__(self) -> None:
        self._recent_alerts: dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def dispatch_high_risk_transaction(
        self,
        alert: HighRiskTransactionAlert,
    ) -> None:
        """Fan out configured alert channels without raising into transaction flow."""
        if not await self._should_dispatch(alert):
            logger.info("[ALERT] Duplicate high-risk alert suppressed", extra={"transaction_id": alert.transaction_id})
            return

        results = await asyncio.gather(
            self.send_slack_alert(alert),
            self.send_email_alert(alert),
            self.dispatch_webhook(alert),
            return_exceptions=True,
        )
        for result in results:
            if isinstance(result, Exception):
                logger.error(
                    "[ALERT ERROR] Unexpected alert dispatch failure",
                    exc_info=(type(result), result, result.__traceback__),
                    extra={"transaction_id": alert.transaction_id},
                )

    async def send_slack_alert(self, alert: HighRiskTransactionAlert) -> None:
        webhook_url = settings.SLACK_WEBHOOK_URL
        if not webhook_url:
            return
        if not self._is_valid_webhook_url(webhook_url):
            logger.error("[ALERT ERROR] Invalid Slack webhook URL")
            return

        try:
            async with httpx.AsyncClient(timeout=settings.ALERT_HTTP_TIMEOUT_SECONDS) as client:
                response = await client.post(webhook_url, json=self._slack_payload(alert))
                response.raise_for_status()
            logger.info("[ALERT] Slack notification sent", extra={"transaction_id": alert.transaction_id})
        except Exception as exc:
            logger.error(
                "[ALERT ERROR] Slack notification failed: %s",
                exc,
                extra={"transaction_id": alert.transaction_id},
            )

    async def send_email_alert(self, alert: HighRiskTransactionAlert) -> None:
        if not settings.ALERT_EMAIL_ENABLED:
            return
        if not self._email_configured():
            return

        try:
            message = self._email_message(alert)
            await asyncio.to_thread(self._send_smtp_message, message)
            logger.info("[ALERT] Email notification sent", extra={"transaction_id": alert.transaction_id})
        except Exception as exc:
            logger.error(
                "[ALERT ERROR] Email notification failed: %s",
                exc,
                extra={"transaction_id": alert.transaction_id},
            )

    async def dispatch_webhook(self, alert: HighRiskTransactionAlert) -> None:
        webhook_url = settings.OUTGOING_WEBHOOK_URL
        if not webhook_url:
            return
        if not self._is_valid_webhook_url(webhook_url):
            logger.error("[ALERT ERROR] Invalid outgoing webhook URL")
            return

        try:
            async with httpx.AsyncClient(timeout=settings.ALERT_HTTP_TIMEOUT_SECONDS) as client:
                response = await client.post(webhook_url, json=alert.webhook_payload())
                response.raise_for_status()
            logger.info("[ALERT] Webhook dispatched", extra={"transaction_id": alert.transaction_id})
        except Exception as exc:
            logger.error(
                "[ALERT ERROR] Webhook dispatch failed: %s",
                exc,
                extra={"transaction_id": alert.transaction_id},
            )

    async def _should_dispatch(self, alert: HighRiskTransactionAlert) -> bool:
        now = datetime.now(timezone.utc).timestamp()
        async with self._lock:
            self._recent_alerts = {
                key: expires_at for key, expires_at in self._recent_alerts.items() if expires_at > now
            }
            if alert.transaction_id in self._recent_alerts:
                return False
            self._recent_alerts[alert.transaction_id] = now + settings.ALERT_COOLDOWN_SECONDS
            return True

    def _slack_payload(self, alert: HighRiskTransactionAlert) -> dict[str, Any]:
        indicators = "\n".join(f"- {indicator}" for indicator in alert.indicators)
        fallback = (
            f"HIGH RISK TRANSACTION DETECTED: {alert.transaction_id} "
            f"risk score {alert.risk_score}"
        )
        return {
            "text": fallback,
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "\U0001F6A8 HIGH RISK TRANSACTION DETECTED"},
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Transaction ID:*\n{alert.transaction_id}"},
                        {"type": "mrkdwn", "text": f"*Amount:*\n{self._format_currency(alert.amount)}"},
                        {"type": "mrkdwn", "text": f"*Risk Score:*\n{alert.risk_score:g}"},
                        {"type": "mrkdwn", "text": f"*Risk Level:*\n{alert.risk_level}"},
                        {"type": "mrkdwn", "text": f"*Sender:*\n{alert.sender}"},
                        {"type": "mrkdwn", "text": f"*Receiver:*\n{alert.receiver}"},
                    ],
                },
                {"type": "section", "text": {"type": "mrkdwn", "text": f"*Indicators:*\n{indicators}"}},
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": (
                                f"*Severity:* {alert.severity.upper()} | "
                                f"*Timestamp:* {alert.timestamp.isoformat()}"
                            ),
                        }
                    ],
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": "*Status:*\nImmediate manual review recommended."},
                },
            ],
        }

    def _email_message(self, alert: HighRiskTransactionAlert) -> EmailMessage:
        message = EmailMessage()
        message["Subject"] = (
            f"[CRITICAL] Fraud Alert {alert.transaction_id} - "
            f"{self._format_currency(alert.amount)}"
        )
        message["From"] = settings.ALERT_FROM_EMAIL or settings.SMTP_USERNAME or ""
        message["To"] = settings.ALERT_TO_EMAIL or ""
        message.set_content(self._plain_text_email(alert))
        message.add_alternative(self._html_email(alert), subtype="html")
        return message

    def _send_smtp_message(self, message: EmailMessage) -> None:
        assert settings.SMTP_HOST is not None
        timeout = settings.ALERT_HTTP_TIMEOUT_SECONDS
        if settings.SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout, context=context) as smtp:
                self._smtp_login(smtp)
                smtp.send_message(message)
            return

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
            self._smtp_login(smtp)
            smtp.send_message(message)

    def _smtp_login(self, smtp: smtplib.SMTP) -> None:
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

    def _plain_text_email(self, alert: HighRiskTransactionAlert) -> str:
        indicators = "\n".join(f"- {indicator}" for indicator in alert.indicators)
        return (
            "HIGH RISK TRANSACTION DETECTED\n\n"
            f"Transaction ID: {alert.transaction_id}\n"
            f"Amount: {self._format_currency(alert.amount)}\n"
            f"Risk Score: {alert.risk_score:g}\n"
            f"Risk Level: {alert.risk_level}\n"
            f"Sender: {alert.sender}\n"
            f"Receiver: {alert.receiver}\n"
            f"Timestamp: {alert.timestamp.isoformat()}\n\n"
            f"Indicators:\n{indicators}\n\n"
            "Recommended action: Hold or review the transaction immediately."
        )

    def _html_email(self, alert: HighRiskTransactionAlert) -> str:
        indicator_items = "".join(f"<li>{html.escape(indicator)}</li>" for indicator in alert.indicators)
        rows = {
            "Transaction ID": alert.transaction_id,
            "Amount": self._format_currency(alert.amount),
            "Risk Score": f"{alert.risk_score:g}",
            "Risk Level": alert.risk_level,
            "Sender": alert.sender,
            "Receiver": alert.receiver,
            "Timestamp": alert.timestamp.isoformat(),
        }
        table_rows = "".join(
            "<tr>"
            f"<th>{html.escape(label)}</th>"
            f"<td>{html.escape(value)}</td>"
            "</tr>"
            for label, value in rows.items()
        )
        return f"""
<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
      <div style="background:#991b1b;color:#ffffff;border-radius:8px;padding:22px;">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">
          Critical Fraud Alert
        </p>
        <h1 style="margin:0;font-size:24px;">High-risk transaction requires review</h1>
        <p style="margin:12px 0 0;font-size:15px;">
          Risk score {alert.risk_score:g} was generated for transaction {html.escape(alert.transaction_id)}.
        </p>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;margin-top:18px;padding:22px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">Transaction details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          {table_rows}
        </table>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;margin-top:18px;padding:22px;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">Risk indicators</h2>
        <ul style="margin:0;padding-left:20px;line-height:1.6;">{indicator_items}</ul>
      </div>
      <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;margin-top:18px;padding:18px;">
        <strong>Recommended action:</strong>
        Hold or review the transaction immediately and verify account activity before release.
      </div>
    </div>
  </body>
</html>
"""

    def _email_configured(self) -> bool:
        configured = all(
            [
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                settings.ALERT_FROM_EMAIL or settings.SMTP_USERNAME,
                settings.ALERT_TO_EMAIL,
            ]
        )
        if not configured:
            logger.warning("[ALERT ERROR] Email alerts enabled but SMTP settings are incomplete")
        return configured

    def _is_valid_webhook_url(self, url: str) -> bool:
        parsed = urlparse(url)
        if parsed.scheme not in {"https", "http"} or not parsed.netloc:
            return False
        if parsed.scheme == "https":
            return True
        return parsed.hostname in {"localhost", "127.0.0.1", "::1"}

    def _format_currency(self, amount: float) -> str:
        return f"Rs. {amount:,.2f}"


alert_service = AlertService()
