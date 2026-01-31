-- =========================================================
-- SQL Seeds for MMRRDiKub Trading Journal
-- Database: PostgreSQL
-- Author: Antigravity
-- =========================================================

-- 1. Seed Exchanges
INSERT INTO exchanges (name, maker_fee, taker_fee) VALUES
('Binance', 0.04000, 0.02000),  -- VIP/BNB burn scenarios usually lower, adjusted base generic
('Bitkub', 0.25000, 0.25000),   -- Standard Bitkub Fee
('OKX', 0.08000, 0.10000)       -- Generic OKX Fee
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Assets
-- Crypto
INSERT INTO assets (symbol, type, tick_size) VALUES
('BTCUSDT', 'Crypto', 0.0100000000),
('ETHUSDT', 'Crypto', 0.0100000000),
('SOLUSDT', 'Crypto', 0.0100000000);

-- Forex (CFD typically)
INSERT INTO assets (symbol, type, tick_size) VALUES
('XAUUSD', 'Forex', 0.0100000000); -- Gold

-- Example User (Mock)
-- PasswordHash: 'mock_hash' (In prod, use real bcrypt hash)
INSERT INTO users (username, password_hash, role) VALUES
('testuser', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'user');
