-- Create tables

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL CHECK (broker IN ('zerodha', 'angelone')),
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  client_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, broker)
);

CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  market TEXT[],
  timeframe TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL,
  broker_trade_id TEXT,
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('NSE', 'BSE', 'F&O', 'Crypto')),
  instrument_type TEXT NOT NULL CHECK (
    instrument_type IN ('EQ', 'CE', 'PE', 'FUT', 'CRYPTO')
  ),
  direction TEXT CHECK (direction IN ('LONG', 'SHORT')),
  entry_price NUMERIC(18,4),
  exit_price NUMERIC(18,4),
  quantity NUMERIC(18,4),
  pnl NUMERIC(18,2),
  charges NUMERIC(18,2),
  net_pnl NUMERIC(18,2),
  status TEXT CHECK (status IN ('WIN', 'LOSS', 'BREAKEVEN')),
  
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  setup_description TEXT,
  mindset TEXT,
  decision_notes TEXT,
  learnings TEXT,
  discipline_score SMALLINT CHECK (discipline_score BETWEEN 1 AND 5),
  tags TEXT[],
  
  source TEXT CHECK (source IN ('broker_sync', 'manual')) DEFAULT 'broker_sync',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, broker, broker_trade_id)
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  market_bias TEXT,
  key_levels TEXT,
  watchlist TEXT,
  news_notes TEXT,
  
  reflection TEXT,
  what_went_well TEXT,
  what_to_improve TEXT,
  
  mood TEXT,
  overall_discipline SMALLINT CHECK (overall_discipline BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deep_analysis', 'weekly_digest', 'trade_feedback')),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  trades_analyzed_count INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own broker_connections" ON broker_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own strategies" ON strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own trades" ON trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own journal_entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own ai_insights" ON ai_insights FOR ALL USING (auth.uid() = user_id);
