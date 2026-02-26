-- Monthly usage tracking per user
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Feature counters (reset monthly)
  script_generator INT DEFAULT 0,     -- Gerador de roteiros
  proposals INT DEFAULT 0,            -- Propostas e planilhas
  image_analysis INT DEFAULT 0,       -- Análise de imagens
  storyboard INT DEFAULT 0,           -- Storyboard

  -- Storage (cumulative, NOT reset monthly)
  storage_used_bytes BIGINT DEFAULT 0, -- Armazenamento usado em bytes

  -- Period tracking
  period_start DATE NOT NULL,         -- First day of the month (e.g., 2026-03-01)
  period_end DATE NOT NULL,           -- Last day of the month (e.g., 2026-03-31)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One record per user per month
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage(user_id, period_start);
