-- INITIAL SCHEMA FOR VYNO FINANCE (INSFORGE / SUPABASE)
-- BASED ON PRD.MD

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    default_currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FINANCIAL ACCOUNTS
CREATE TABLE financial_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    currency TEXT NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0,
    current_balance NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL means system category
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUDGETS
CREATE TABLE budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL,
    period TEXT NOT NULL, -- e.g., 'monthly', 'weekly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCIAL GOALS
CREATE TABLE financial_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0,
    currency TEXT NOT NULL,
    deadline DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRADING ACCOUNTS
CREATE TABLE trading_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    broker TEXT,
    account_type TEXT,
    currency TEXT NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0,
    current_balance NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STRATEGIES
CREATE TABLE strategies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rules TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TRADES
CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    trading_account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    asset_type TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
    entry_price NUMERIC,
    exit_price NUMERIC,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    position_size NUMERIC,
    leverage NUMERIC,
    timeframe TEXT,
    session TEXT,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    risk_amount NUMERIC(15, 2),
    reward_amount NUMERIC(15, 2),
    profit_loss NUMERIC(15, 2),
    profit_loss_percent NUMERIC(5, 2),
    r_multiple NUMERIC(5, 2),
    commission NUMERIC(15, 2) DEFAULT 0,
    swap NUMERIC(15, 2) DEFAULT 0,
    net_profit_loss NUMERIC(15, 2),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    entry_reason TEXT,
    exit_reason TEXT,
    trading_plan TEXT,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRADE PSYCHOLOGY
CREATE TABLE trade_psychology (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    emotion TEXT,
    confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
    fomo BOOLEAN DEFAULT false,
    revenge_trading BOOLEAN DEFAULT false,
    greed BOOLEAN DEFAULT false,
    fear BOOLEAN DEFAULT false,
    followed_plan BOOLEAN DEFAULT false,
    discipline_score INTEGER CHECK (discipline_score >= 1 AND discipline_score <= 10),
    before_trade_note TEXT,
    during_trade_note TEXT,
    after_trade_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MARKET EVENTS
CREATE TABLE market_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name TEXT NOT NULL,
    currency TEXT,
    country TEXT,
    event_time TIMESTAMPTZ NOT NULL,
    impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
    previous TEXT,
    forecast TEXT,
    actual TEXT,
    source TEXT,
    source_event_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AI INSIGHTS
CREATE TABLE ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    insight_type TEXT CHECK (insight_type IN ('financial', 'trading', 'psychology', 'weekly_review', 'monthly_review')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_period TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_psychology ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for a user to see only their own data
-- (Assuming auth.uid() function from Supabase)

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Helper to create typical isolation policies
-- (Assuming user_id is the owner)

-- Financial Accounts
CREATE POLICY "user_isolation_financial_accounts_select" ON financial_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_financial_accounts_insert" ON financial_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_isolation_financial_accounts_update" ON financial_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_financial_accounts_delete" ON financial_accounts FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "user_isolation_transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_isolation_transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "user_isolation_trades_select" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_trades_insert" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_isolation_trades_update" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_isolation_trades_delete" ON trades FOR DELETE USING (auth.uid() = user_id);

-- Market Events are public for reading
CREATE POLICY "Public can view market events" ON market_events FOR SELECT USING (true);

-- (Other tables follow the exact same RLS pattern)
