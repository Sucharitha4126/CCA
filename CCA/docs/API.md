# SentinelPay API Documentation

Base URL:

- Local: `http://localhost:8000`
- Production: Render service URL

Authentication uses JWT bearer tokens:

```http
Authorization: Bearer <access_token>
```

## Auth

### Register

`POST /api/auth/register`

```json
{
  "name": "Maya Shah",
  "email": "maya@example.com",
  "phone_number": "+91 98765 43001",
  "account_number": "SP-100245",
  "digital_signature": "Maya-Secure-2026",
  "password": "Secure@123"
}
```

Returns:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "role": "user"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "admin@sentinelpay.io",
  "password": "Admin@123"
}
```

## Users

### Current Profile

`GET /api/users/me`

Returns the authenticated user's profile, balance, risk score, role, and freeze status.

### Balance

`GET /api/users/balance`

### Alerts

`GET /api/users/alerts`

Returns recent fraud alerts for the authenticated user.

## Transactions

### List Transactions

`GET /api/transactions`

Admins receive all transactions. Users receive only transactions where they are sender or receiver.

### AI Evaluate Transaction

`POST /api/transactions/evaluate`

```json
{
  "receiver_email": "arjun@sentinelpay.io",
  "amount": 1250
}
```

Returns:

```json
{
  "score": 22,
  "risk_level": "LOW RISK",
  "reasons": ["No major suspicious pattern detected."],
  "recommendation": "Allow transaction and continue passive monitoring."
}
```

### Create Transaction

`POST /api/transactions`

```json
{
  "receiver_email": "arjun@sentinelpay.io",
  "amount": 1250
}
```

The backend evaluates fraud risk, updates balances, creates alerts when needed, syncs graph data, and broadcasts a WebSocket event.

## Admin

### Analytics

`GET /api/admin/analytics`

Returns transaction count, fraud count, suspicious account count, volume, average risk, and risk distribution.

### Users

`GET /api/admin/users`

### Freeze or Unfreeze User

`PATCH /api/admin/users/{user_id}/freeze`

```json
{
  "is_frozen": true
}
```

### Fraud Alerts

`GET /api/admin/alerts`

### Activity Logs

`GET /api/admin/activity-logs`

## Graph

### Visualization Payload

`GET /api/graph`

Returns:

- `nodes`: users
- `links`: transaction relationships
- `analysis`: cycle and suspicious node metrics

### Admin Graph Analysis

`GET /api/graph/analysis`

Admin-only endpoint for graph cycle, centrality, and suspicious account analysis.

## WebSocket

`WS /ws/transactions`

Event example:

```json
{
  "type": "transaction.created",
  "payload": {
    "id": 12,
    "amount": 15400,
    "risk_level": "HIGH RISK",
    "fraud_score": 86
  }
}
```
