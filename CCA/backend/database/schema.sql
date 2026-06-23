CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  full_name VARCHAR(120),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(30),
  address VARCHAR(255),
  dob DATE,
  account_number VARCHAR(40) UNIQUE,
  ifsc_code VARCHAR(20),
  bank_name VARCHAR(120),
  branch_name VARCHAR(120),
  account_type VARCHAR(20),
  pan_number VARCHAR(20),
  password VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  public_key VARCHAR(4096),
  encrypted_private_key VARCHAR(8192),
  digital_identity VARCHAR(128) UNIQUE,
  role VARCHAR(20) DEFAULT 'user',
  balance DOUBLE PRECISION DEFAULT 25000,
  risk_score DOUBLE PRECISION DEFAULT 12,
  is_frozen BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  signature_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  amount DOUBLE PRECISION NOT NULL,
  transaction_hash VARCHAR(128),
  digital_signature TEXT,
  signature_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) DEFAULT 'completed',
  fraud_score DOUBLE PRECISION DEFAULT 0,
  risk_level VARCHAR(30) DEFAULT 'LOW RISK',
  ai_summary VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id INTEGER REFERENCES transactions(id),
  alert_type VARCHAR(80) NOT NULL,
  severity VARCHAR(30) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
