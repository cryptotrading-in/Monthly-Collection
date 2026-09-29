CREATE TABLE IF NOT EXISTS app_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);