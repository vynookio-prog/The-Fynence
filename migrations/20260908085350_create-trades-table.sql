CREATE TABLE public.trades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trading_account_id text NOT NULL,
    trading_account_name text,
    symbol text NOT NULL,
    asset_type text NOT NULL,
    direction text NOT NULL CHECK (direction IN ('buy', 'sell')),
    entry_price numeric NOT NULL,
    exit_price numeric NOT NULL,
    stop_loss numeric NOT NULL,
    take_profit numeric NOT NULL,
    position_size numeric NOT NULL,
    leverage numeric DEFAULT 1,
    timeframe text NOT NULL,
    session text NOT NULL,
    entry_time timestamp with time zone NOT NULL,
    exit_time timestamp with time zone NOT NULL,
    risk_amount numeric(15, 2) DEFAULT 0,
    reward_amount numeric(15, 2) DEFAULT 0,
    profit_loss numeric(15, 2) DEFAULT 0,
    profit_loss_percent numeric(10, 2) DEFAULT 0,
    r_multiple numeric(10, 2) DEFAULT 0,
    commission numeric(15, 2) DEFAULT 0,
    swap numeric(15, 2) DEFAULT 0,
    net_profit_loss numeric(15, 2) DEFAULT 0,
    status text NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'cancelled')),
    entry_reason text,
    exit_reason text,
    trading_plan text,
    strategy_id text,
    strategy_name text,
    psychology jsonb NOT NULL DEFAULT '{}'::jsonb,
    screenshot_url text,
    correlated_news jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated User Isolation
CREATE POLICY "Users can view their own trades" 
ON public.trades FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" 
ON public.trades FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades FOR DELETE 
USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_entry_time ON public.trades(entry_time DESC);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
