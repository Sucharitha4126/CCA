from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import Transaction
from app.models.user import User
from app.services.graph_service import graph_service


class FraudEngine:
    def evaluate(self, db: Session, sender: User, receiver: User, amount: float) -> dict:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=settings.RAPID_TRANSFER_WINDOW_MINUTES)
        recent_sender = (
            db.query(Transaction)
            .filter(Transaction.sender_id == sender.id, Transaction.created_at >= window_start)
            .all()
        )
        recent_receiver = (
            db.query(Transaction)
            .filter(Transaction.receiver_id == receiver.id, Transaction.created_at >= window_start)
            .all()
        )
        transactions = db.query(Transaction).all()

        score = 5.0
        reasons: list[str] = []

        if amount >= settings.HIGH_VALUE_THRESHOLD:
            score += 65
            reasons.append("High-value transfer exceeds configured threshold.")

        if sender.balance > 0:
            balance_ratio = amount / sender.balance
            if balance_ratio >= 0.85:
                score += 28
                reasons.append("Balance draining behavior detected: transfer would consume most available funds.")
            elif balance_ratio >= 0.5:
                score += 16
                reasons.append("Sudden large withdrawal relative to current account balance.")

        if len(recent_sender) >= settings.RAPID_TRANSFER_LIMIT:
            score += 22
            reasons.append("Rapid transfer velocity from sender within short time window.")

        recent_sender_total = sum(tx.amount for tx in recent_sender)
        if sender.balance > 0 and recent_sender_total + amount >= sender.balance * 0.75:
            score += 18
            reasons.append("Abnormal spending pattern could drain account balance within the monitoring window.")

        unique_targets = {tx.receiver_id for tx in recent_sender}
        if len(unique_targets) >= 3:
            score += 18
            reasons.append("One-to-many transfer pattern detected.")

        unique_sources = {tx.sender_id for tx in recent_receiver}
        if len(unique_sources) >= 3:
            score += 18
            reasons.append("Many-to-one collection pattern detected.")

        graph_payload = graph_service.analyze(db)
        for cycle in graph_payload["cycles"]:
            if sender.id in cycle or receiver.id in cycle:
                score += 24
                reasons.append("Cyclic money movement is connected to this transaction.")
                break

        if sender.id in graph_payload["suspicious_nodes"] or receiver.id in graph_payload["suspicious_nodes"]:
            score += 15
            reasons.append("Suspicious graph centrality around one or more accounts.")

        model_score = self._anomaly_score(transactions, amount)
        score += model_score
        if model_score > 12:
            reasons.append("AI anomaly model found this amount unusual compared with history.")

        score = float(min(round(score, 2), 100))
        if score >= 70:
            risk_level = "HIGH RISK"
            recommendation = "Hold for manual review, alert admin, and consider account freeze."
        elif score >= 40:
            risk_level = "MEDIUM RISK"
            recommendation = "Allow with enhanced monitoring and notify compliance team."
        else:
            risk_level = "LOW RISK"
            recommendation = "Allow transaction and continue passive monitoring."

        if not reasons:
            reasons.append("No major suspicious pattern detected.")

        return {
            "score": score,
            "risk_level": risk_level,
            "reasons": reasons,
            "recommendation": recommendation,
        }

    def _anomaly_score(self, transactions: list[Transaction], amount: float) -> float:
        if len(transactions) < 8:
            return 0
        df = pd.DataFrame([{"amount": tx.amount, "risk": tx.fraud_score} for tx in transactions])
        features = df[["amount", "risk"]].to_numpy()
        model = IsolationForest(contamination=0.15, random_state=42)
        model.fit(features)
        prediction = model.predict(np.array([[amount, 0]]))
        return 15 if prediction[0] == -1 else 0


fraud_engine = FraudEngine()
