-- Fix numeric field overflow: Alternative approach
-- Step 1: Find dependent views (run this first to see what's blocking)
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
AND definition LIKE '%trades%';

-- Step 2: If no critical views, drop and recreate with correct types
-- WARNING: This will delete all trade data! Backup first if needed.

-- Backup existing data (optional)
CREATE TABLE trades_backup AS SELECT * FROM trades;

-- Drop the table
DROP TABLE IF EXISTS trades CASCADE;

-- Recreate with correct decimal types
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Info
    pair VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    exchange VARCHAR(50),
    
    -- Entry
    entry_price DECIMAL(24,8) NOT NULL,
    entry_time TIMESTAMP,
    entry_reason VARCHAR(100),
    
    -- Exit
    exit_price DECIMAL(24,8),
    exit_time TIMESTAMP,
    
    -- Position
    position_size DECIMAL(18,2) NOT NULL,
    quantity DECIMAL(24,8),
    leverage INT DEFAULT 1,
    
    -- Risk Management
    risk_percent DECIMAL(5,2),
    stop_loss DECIMAL(24,8),
    take_profit DECIMAL(24,8),
    
    -- Calculated Values
    risk_reward_ratio DECIMAL(6,2),
    max_win DECIMAL(18,2),
    max_loss DECIMAL(18,2),
    fee DECIMAL(18,4),
    
    -- AI Score
    setup_score INT DEFAULT 3 CHECK (setup_score >= 1 AND setup_score <= 5),
    
    -- Result
    pnl DECIMAL(18,2),
    pnl_percent DECIMAL(8,4),
    status VARCHAR(20) DEFAULT 'OPEN',
    
    -- Notes & Tags
    notes TEXT,
    tags VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Additional fields for compatibility
    opened_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);

-- Restore data if you backed it up (optional)
-- INSERT INTO trades SELECT * FROM trades_backup;

-- Drop backup table (optional)
-- DROP TABLE trades_backup;
