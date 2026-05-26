# Cloud-Based Transaction Monitoring and AI Fraud Detection System

Enterprise-style fintech SaaS application for real-time transaction monitoring, AI-assisted fraud scoring, graph fraud analysis, and role-based dashboards.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, React Router, Axios, Recharts, Lucide React, React Force Graph
- Backend: FastAPI, SQLAlchemy, JWT, WebSockets, async queue event bus
- Databases: PostgreSQL/Supabase for transactional data, Neo4j Aura for graph relationships
- AI/ML: Scikit-learn, NetworkX, Pandas, NumPy with rule-based fraud scoring
- Cloud: Vercel frontend, Render backend, Supabase PostgreSQL, Neo4j Aura Free, Cloudinary-ready env config

## Project Structure

```text
frontend/
  src/
    api/
    components/
    context/
    data/
    pages/
    utils/
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    services/
    realtime/
  scripts/
  database/
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python scripts/seed_data.py
uvicorn app.main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Demo Accounts

- Admin: `admin@sentinelpay.io` / `Admin@123`
- User: `maya@sentinelpay.io` / `User@123`
- User: `arjun@sentinelpay.io` / `User@123`

Registration includes phone number, account number, and a hashed digital safety signature for a more realistic fintech onboarding demo.

## Deployment

### Supabase PostgreSQL

1. Create a Supabase project.
2. Copy the connection string.
3. Set `DATABASE_URL` in Render using the SQLAlchemy format:
   `postgresql+psycopg2://USER:PASSWORD@HOST:PORT/postgres`
4. Run `backend/database/schema.sql` in Supabase SQL editor or let SQLAlchemy create tables on first startup.

### Neo4j Aura Free

1. Create a Neo4j Aura Free database.
2. Copy URI, username, and password.
3. Set `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` in Render.
4. Optional graph queries are in `backend/database/neo4j_queries.cypher`.

### Render Backend

1. Push this repository to GitHub.
2. Create a Render Web Service.
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `backend/.env.example`.

### Vercel Frontend

1. Import the repository in Vercel.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add `VITE_API_URL=https://your-render-service.onrender.com`.

## Core Fraud Detection

The AI fraud engine combines rule scoring, behavioral analysis, and graph signals:

- Many-to-one transfer bursts
- One-to-many distribution bursts
- Cyclic transaction loops
- High-value transfers
- Rapid transfer velocity
- Suspicious network centrality and cycle features

Risk levels returned by APIs:

- `LOW RISK`
- `MEDIUM RISK`
- `HIGH RISK`

## Real-time Fraud Alerts

Transactions with a fraud risk score greater than `90` trigger real-time alert fan-out after the transaction is committed. Alerts are dispatched asynchronously so Slack, SMTP, or webhook failures never block the transaction API response.

Supported channels:

- Slack Incoming Webhooks for compliance or security channels
- SMTP email alerts for compliance admins
- Generic outgoing JSON webhooks for SIEM, SOAR, or internal automation
- WebSocket broadcast events for live admin dashboards

### Slack integration setup

1. Create a Slack app and enable Incoming Webhooks.
2. Add the webhook to the compliance/security channel.
3. Set `SLACK_WEBHOOK_URL` in `backend/.env` or your deployment environment.

Example Slack payload shape:

```json
{
  "text": "HIGH RISK TRANSACTION DETECTED: TXN-29381 risk score 97",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 HIGH RISK TRANSACTION DETECTED"
      }
    }
  ]
}
```

### SMTP setup

Set SMTP values for your email provider:

```env
ALERT_EMAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=alerts@example.com
SMTP_PASSWORD=replace-with-secret
ALERT_FROM_EMAIL=alerts@example.com
ALERT_TO_EMAIL=compliance@example.com
```

Email alerts use an HTML summary card, transaction details table, fraud indicators, timestamp, and recommended manual review action.

### Generic webhook setup

Set `OUTGOING_WEBHOOK_URL` to receive high-risk transaction events:

```json
{
  "event": "high_risk_transaction",
  "transaction_id": "TXN-29381",
  "risk_score": 97,
  "risk_level": "HIGH RISK",
  "severity": "critical",
  "amount": 14500,
  "sender": "maya@sentinelpay.io",
  "receiver": "arjun@sentinelpay.io",
  "timestamp": "2026-05-24T10:45:00+00:00",
  "indicators": [
    "Velocity anomaly",
    "Cyclic transfer pattern",
    "High-value burst"
  ]
}
```

### Example alert environment

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
ALERT_EMAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=alerts@example.com
SMTP_PASSWORD=replace-with-secret
ALERT_FROM_EMAIL=alerts@example.com
ALERT_TO_EMAIL=compliance@example.com
OUTGOING_WEBHOOK_URL=https://security.example.com/fraud-events
ALERT_HTTP_TIMEOUT_SECONDS=5
ALERT_COOLDOWN_SECONDS=300
```

Screenshots:

```text
[Slack alert screenshot placeholder]
[HTML email screenshot placeholder]
```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/users/balance`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{user_id}/freeze`
- `GET /api/graph`
- `GET /api/graph/analysis`
- `WS /ws/transactions`

## Notes

- SQLite is used locally by default for zero-friction demos. Set `DATABASE_URL` to PostgreSQL for production.
- Neo4j is optional locally; NetworkX fallback keeps graph analysis working without Aura credentials.
- This project includes realistic sample users, transactions, and fraud cases through `backend/scripts/seed_data.py`.
