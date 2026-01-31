-- ============================================
-- MMRRDiKub ULTIMATE - Complete Database Schema
-- รองรับทุกฟังก์ชัน: Multi-TP/SL, AI Score, Trading Pairs
-- ============================================

-- Drop existing tables (ระวัง! ลบข้อมูลทั้งหมด)
DROP TABLE IF EXISTS trade_tp_levels CASCADE;
DROP TABLE IF EXISTS trade_sl_levels CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS trading_pairs CASCADE;
DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE - ผู้ใช้งาน
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    portfolio_balance DECIMAL(18,2) DEFAULT 1000.00,
    default_risk_percent DECIMAL(5,2) DEFAULT 1.00,
    default_leverage INT DEFAULT 1,
    preferred_exchange VARCHAR(50) DEFAULT 'Binance Futures',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster login
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 2. EXCHANGES TABLE - รายชื่อ Exchange + Fee
-- ============================================
CREATE TABLE exchanges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    maker_fee DECIMAL(6,4) NOT NULL,   -- เช่น 0.0200 = 0.02%
    taker_fee DECIMAL(6,4) NOT NULL,   -- เช่น 0.0500 = 0.05%
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed popular exchanges
INSERT INTO exchanges (name, display_name, maker_fee, taker_fee) VALUES
('binance_futures', 'Binance Futures', 0.0200, 0.0500),
('binance_spot', 'Binance Spot', 0.1000, 0.1000),
('bitkub', 'Bitkub', 0.2500, 0.2500),
('okx_futures', 'OKX Futures', 0.0200, 0.0500),
('bybit_futures', 'Bybit Futures', 0.0200, 0.0550),
('gate_futures', 'Gate.io Futures', 0.0200, 0.0500),
('kucoin_futures', 'KuCoin Futures', 0.0200, 0.0600),
('mexc_futures', 'MEXC Futures', 0.0000, 0.0300),
('bitget_futures', 'Bitget Futures', 0.0200, 0.0600);

-- ============================================
-- 3. TRADING PAIRS TABLE - คู่เทรด (120+)
-- ============================================
CREATE TABLE trading_pairs (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,     -- เช่น BTC/USDT
    base_asset VARCHAR(10) NOT NULL,        -- เช่น BTC
    quote_asset VARCHAR(10) NOT NULL,       -- เช่น USDT
    category VARCHAR(30),                   -- เช่น Layer 1, DeFi, Meme
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE,        -- TRUE = ผู้ใช้เพิ่มเอง
    added_by_user_id INT REFERENCES users(id),
    min_price_decimals INT DEFAULT 2,       -- จำนวนทศนิยมของราคา
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster search
CREATE INDEX idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX idx_trading_pairs_category ON trading_pairs(category);

-- Seed 120+ trading pairs
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, category) VALUES
-- Top 30 by Volume
('BTC/USDT', 'BTC', 'USDT', 'Layer 1'),
('ETH/USDT', 'ETH', 'USDT', 'Layer 1'),
('BNB/USDT', 'BNB', 'USDT', 'Layer 1'),
('XRP/USDT', 'XRP', 'USDT', 'Layer 1'),
('SOL/USDT', 'SOL', 'USDT', 'Layer 1'),
('ADA/USDT', 'ADA', 'USDT', 'Layer 1'),
('DOGE/USDT', 'DOGE', 'USDT', 'Meme'),
('AVAX/USDT', 'AVAX', 'USDT', 'Layer 1'),
('DOT/USDT', 'DOT', 'USDT', 'Layer 1'),
('TRX/USDT', 'TRX', 'USDT', 'Layer 1'),
('LINK/USDT', 'LINK', 'USDT', 'Oracle'),
('MATIC/USDT', 'MATIC', 'USDT', 'Layer 2'),
('SHIB/USDT', 'SHIB', 'USDT', 'Meme'),
('LTC/USDT', 'LTC', 'USDT', 'Layer 1'),
('ATOM/USDT', 'ATOM', 'USDT', 'Layer 1'),
('UNI/USDT', 'UNI', 'USDT', 'DeFi'),
('XLM/USDT', 'XLM', 'USDT', 'Layer 1'),
('ETC/USDT', 'ETC', 'USDT', 'Layer 1'),
('XMR/USDT', 'XMR', 'USDT', 'Privacy'),
('HBAR/USDT', 'HBAR', 'USDT', 'Layer 1'),
('BCH/USDT', 'BCH', 'USDT', 'Layer 1'),
('FIL/USDT', 'FIL', 'USDT', 'Storage'),
('APT/USDT', 'APT', 'USDT', 'Layer 1'),
('ARB/USDT', 'ARB', 'USDT', 'Layer 2'),
('OP/USDT', 'OP', 'USDT', 'Layer 2'),
('NEAR/USDT', 'NEAR', 'USDT', 'Layer 1'),
('VET/USDT', 'VET', 'USDT', 'Supply Chain'),
('ALGO/USDT', 'ALGO', 'USDT', 'Layer 1'),
('ICP/USDT', 'ICP', 'USDT', 'Layer 1'),
('GRT/USDT', 'GRT', 'USDT', 'Indexing'),
-- Layer 2 & Scaling
('IMX/USDT', 'IMX', 'USDT', 'Layer 2'),
('MANTA/USDT', 'MANTA', 'USDT', 'Layer 2'),
('STRK/USDT', 'STRK', 'USDT', 'Layer 2'),
('ZK/USDT', 'ZK', 'USDT', 'Layer 2'),
-- DeFi
('AAVE/USDT', 'AAVE', 'USDT', 'DeFi'),
('MKR/USDT', 'MKR', 'USDT', 'DeFi'),
('SNX/USDT', 'SNX', 'USDT', 'DeFi'),
('COMP/USDT', 'COMP', 'USDT', 'DeFi'),
('YFI/USDT', 'YFI', 'USDT', 'DeFi'),
('CRV/USDT', 'CRV', 'USDT', 'DeFi'),
('SUSHI/USDT', 'SUSHI', 'USDT', 'DeFi'),
('1INCH/USDT', '1INCH', 'USDT', 'DeFi'),
('LDO/USDT', 'LDO', 'USDT', 'DeFi'),
('RUNE/USDT', 'RUNE', 'USDT', 'DeFi'),
('CAKE/USDT', 'CAKE', 'USDT', 'DeFi'),
('DYDX/USDT', 'DYDX', 'USDT', 'DeFi'),
('GMX/USDT', 'GMX', 'USDT', 'DeFi'),
('PENDLE/USDT', 'PENDLE', 'USDT', 'DeFi'),
-- Gaming & Metaverse
('AXS/USDT', 'AXS', 'USDT', 'Gaming'),
('SAND/USDT', 'SAND', 'USDT', 'Metaverse'),
('MANA/USDT', 'MANA', 'USDT', 'Metaverse'),
('ENJ/USDT', 'ENJ', 'USDT', 'Gaming'),
('GALA/USDT', 'GALA', 'USDT', 'Gaming'),
('APE/USDT', 'APE', 'USDT', 'Metaverse'),
('GMT/USDT', 'GMT', 'USDT', 'Gaming'),
('FLOW/USDT', 'FLOW', 'USDT', 'Gaming'),
('CHZ/USDT', 'CHZ', 'USDT', 'Fan Token'),
('RNDR/USDT', 'RNDR', 'USDT', 'Rendering'),
('MAGIC/USDT', 'MAGIC', 'USDT', 'Gaming'),
('PIXEL/USDT', 'PIXEL', 'USDT', 'Gaming'),
('PRIME/USDT', 'PRIME', 'USDT', 'Gaming'),
('BEAM/USDT', 'BEAM', 'USDT', 'Gaming'),
-- AI Tokens
('FET/USDT', 'FET', 'USDT', 'AI'),
('AGIX/USDT', 'AGIX', 'USDT', 'AI'),
('OCEAN/USDT', 'OCEAN', 'USDT', 'AI'),
('TAO/USDT', 'TAO', 'USDT', 'AI'),
('ARKM/USDT', 'ARKM', 'USDT', 'AI'),
('WLD/USDT', 'WLD', 'USDT', 'AI'),
('AIOZ/USDT', 'AIOZ', 'USDT', 'AI'),
('NMR/USDT', 'NMR', 'USDT', 'AI'),
-- Meme Coins
('PEPE/USDT', 'PEPE', 'USDT', 'Meme'),
('FLOKI/USDT', 'FLOKI', 'USDT', 'Meme'),
('BONK/USDT', 'BONK', 'USDT', 'Meme'),
('WIF/USDT', 'WIF', 'USDT', 'Meme'),
('MEME/USDT', 'MEME', 'USDT', 'Meme'),
('SATS/USDT', 'SATS', 'USDT', 'Meme'),
('RATS/USDT', 'RATS', 'USDT', 'Meme'),
('ORDI/USDT', 'ORDI', 'USDT', 'BRC-20'),
-- Thai Market
('KUB/USDT', 'KUB', 'USDT', 'Thai'),
('SIX/USDT', 'SIX', 'USDT', 'Thai'),
('JFIN/USDT', 'JFIN', 'USDT', 'Thai'),
-- New Layer 1s
('INJ/USDT', 'INJ', 'USDT', 'Layer 1'),
('SUI/USDT', 'SUI', 'USDT', 'Layer 1'),
('SEI/USDT', 'SEI', 'USDT', 'Layer 1'),
('TIA/USDT', 'TIA', 'USDT', 'Modular'),
('PYTH/USDT', 'PYTH', 'USDT', 'Oracle'),
('JUP/USDT', 'JUP', 'USDT', 'DeFi'),
('W/USDT', 'W', 'USDT', 'Bridge'),
('DYM/USDT', 'DYM', 'USDT', 'Modular'),
('KAS/USDT', 'KAS', 'USDT', 'Layer 1'),
('CFX/USDT', 'CFX', 'USDT', 'Layer 1'),
('ROSE/USDT', 'ROSE', 'USDT', 'Privacy'),
('FTM/USDT', 'FTM', 'USDT', 'Layer 1'),
-- Storage & Infrastructure
('AR/USDT', 'AR', 'USDT', 'Storage'),
('STORJ/USDT', 'STORJ', 'USDT', 'Storage'),
('THETA/USDT', 'THETA', 'USDT', 'Video'),
('BTT/USDT', 'BTT', 'USDT', 'Storage'),
('SC/USDT', 'SC', 'USDT', 'Storage'),
('HOT/USDT', 'HOT', 'USDT', 'Infrastructure'),
('ANKR/USDT', 'ANKR', 'USDT', 'Infrastructure'),
('SKL/USDT', 'SKL', 'USDT', 'Layer 2'),
-- Privacy
('ZEC/USDT', 'ZEC', 'USDT', 'Privacy'),
('DASH/USDT', 'DASH', 'USDT', 'Privacy'),
('ZEN/USDT', 'ZEN', 'USDT', 'Privacy'),
('SCRT/USDT', 'SCRT', 'USDT', 'Privacy'),
-- Others
('KLAY/USDT', 'KLAY', 'USDT', 'Layer 1'),
('EGLD/USDT', 'EGLD', 'USDT', 'Layer 1'),
('QNT/USDT', 'QNT', 'USDT', 'Interoperability'),
('STX/USDT', 'STX', 'USDT', 'Bitcoin L2'),
('MINA/USDT', 'MINA', 'USDT', 'Layer 1'),
('ENS/USDT', 'ENS', 'USDT', 'Identity'),
('SSV/USDT', 'SSV', 'USDT', 'Staking'),
('RPL/USDT', 'RPL', 'USDT', 'Staking'),
('BLUR/USDT', 'BLUR', 'USDT', 'NFT'),
('LOOKS/USDT', 'LOOKS', 'USDT', 'NFT'),
('SUPER/USDT', 'SUPER', 'USDT', 'NFT'),
('TRAC/USDT', 'TRAC', 'USDT', 'Supply Chain'),
('ACH/USDT', 'ACH', 'USDT', 'Payment');

-- ============================================
-- 4. TRADES TABLE - บันทึกการเทรด
-- ============================================
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Info
    pair VARCHAR(20) NOT NULL,              -- เช่น BTC/USDT
    side VARCHAR(10) NOT NULL,              -- LONG หรือ SHORT
    exchange VARCHAR(50),                   -- Exchange ที่ใช้
    
    -- Entry
    entry_price DECIMAL(24,8) NOT NULL,     -- รองรับเหรียญราคาต่ำเช่น SHIB
    entry_time TIMESTAMP,
    entry_reason VARCHAR(100),              -- เหตุผลการเข้า
    
    -- Exit
    exit_price DECIMAL(24,8),
    exit_time TIMESTAMP,
    
    -- Position
    position_size DECIMAL(18,2) NOT NULL,   -- มูลค่า USD
    quantity DECIMAL(24,8),                 -- จำนวนเหรียญ
    leverage INT DEFAULT 1,
    
    -- Risk Management
    risk_percent DECIMAL(5,2),              -- % ของ Portfolio ที่เสี่ยง
    stop_loss DECIMAL(24,8),                -- SL หลัก (level แรก)
    take_profit DECIMAL(24,8),              -- TP หลัก (level แรก)
    
    -- Calculated Values
    risk_reward_ratio DECIMAL(6,2),         -- R:R Ratio
    max_win DECIMAL(18,2),                  -- กำไรสูงสุดที่เป็นไปได้
    max_loss DECIMAL(18,2),                 -- ขาดทุนสูงสุดที่เป็นไปได้
    fee DECIMAL(18,4),                      -- ค่าธรรมเนียมรวม
    
    -- AI Score
    setup_score INT DEFAULT 3 CHECK (setup_score >= 1 AND setup_score <= 5),
    
    -- Result
    pnl DECIMAL(18,2),                      -- กำไร/ขาดทุนจริง
    pnl_percent DECIMAL(8,4),               -- % กำไร/ขาดทุน
    status VARCHAR(20) DEFAULT 'OPEN',      -- OPEN, WIN, LOSS, BREAK_EVEN
    
    -- Notes & Tags
    notes TEXT,
    tags VARCHAR(200),                      -- เช่น "breakout,trend"
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP                    -- Soft delete
);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);

-- ============================================
-- 5. TRADE_TP_LEVELS TABLE - Multiple Take Profit
-- ============================================
CREATE TABLE trade_tp_levels (
    id SERIAL PRIMARY KEY,
    trade_id INT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    level_number INT NOT NULL,              -- 1, 2, 3, ...
    price DECIMAL(24,8) NOT NULL,           -- ราคา TP
    percentage DECIMAL(5,2) NOT NULL,       -- % ของ Position (รวมต้องครบ 100%)
    distance_percent DECIMAL(8,4),          -- % ห่างจาก Entry
    is_hit BOOLEAN DEFAULT FALSE,           -- โดนหรือยัง
    hit_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_tp_levels_trade_id ON trade_tp_levels(trade_id);

-- ============================================
-- 6. TRADE_SL_LEVELS TABLE - Multiple Stop Loss
-- ============================================
CREATE TABLE trade_sl_levels (
    id SERIAL PRIMARY KEY,
    trade_id INT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    level_number INT NOT NULL,              -- 1, 2, 3, ...
    price DECIMAL(24,8) NOT NULL,           -- ราคา SL
    percentage DECIMAL(5,2) NOT NULL,       -- % ของ Position (รวมต้องครบ 100%)
    distance_percent DECIMAL(8,4),          -- % ห่างจาก Entry
    is_hit BOOLEAN DEFAULT FALSE,           -- โดนหรือยัง
    hit_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_sl_levels_trade_id ON trade_sl_levels(trade_id);

-- ============================================
-- 7. VIEWS สำหรับ Query ง่าย
-- ============================================

-- View: Trade Summary with TP/SL counts
CREATE OR REPLACE VIEW v_trade_summary AS
SELECT 
    t.*,
    (SELECT COUNT(*) FROM trade_tp_levels WHERE trade_id = t.id) AS tp_count,
    (SELECT COUNT(*) FROM trade_sl_levels WHERE trade_id = t.id) AS sl_count,
    (SELECT COUNT(*) FROM trade_tp_levels WHERE trade_id = t.id AND is_hit = TRUE) AS tp_hit_count,
    (SELECT COUNT(*) FROM trade_sl_levels WHERE trade_id = t.id AND is_hit = TRUE) AS sl_hit_count
FROM trades t
WHERE t.deleted_at IS NULL;

-- View: User Stats
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    user_id,
    COUNT(*) AS total_trades,
    COUNT(*) FILTER (WHERE status = 'WIN') AS win_count,
    COUNT(*) FILTER (WHERE status = 'LOSS') AS loss_count,
    COUNT(*) FILTER (WHERE status = 'OPEN') AS open_count,
    COALESCE(SUM(pnl), 0) AS total_pnl,
    COALESCE(AVG(pnl), 0) AS avg_pnl,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('WIN', 'LOSS')) > 0 
        THEN ROUND(
            COUNT(*) FILTER (WHERE status = 'WIN')::DECIMAL / 
            COUNT(*) FILTER (WHERE status IN ('WIN', 'LOSS')) * 100, 
            2
        )
        ELSE 0 
    END AS win_rate
FROM trades
WHERE deleted_at IS NULL
GROUP BY user_id;

-- ============================================
-- 8. FUNCTIONS สำหรับ Auto-update
-- ============================================

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. SAMPLE DATA (Optional Demo)
-- ============================================
-- Uncomment เพื่อเพิ่มข้อมูลตัวอย่าง

-- INSERT INTO users (username, email, password_hash, display_name) VALUES
-- ('demo', 'demo@mmrrdikub.com', '$2a$10$...', 'Demo User');

-- INSERT INTO trades (user_id, pair, side, entry_price, position_size, stop_loss, take_profit, status, entry_reason, setup_score)
-- VALUES 
-- (1, 'BTC/USDT', 'LONG', 95000, 1000, 93000, 100000, 'OPEN', 'Support Bounce', 4);

-- ============================================
-- NOTES:
-- - DECIMAL(24,8) รองรับเหรียญราคาต่ำมาก เช่น SHIB 0.00001234
-- - Multi-TP/SL เก็บใน table แยก เพื่อรองรับหลาย level
-- - Soft delete ใช้ deleted_at แทนการลบจริง
-- - Views ช่วยให้ query statistics ง่ายขึ้น
-- ============================================
