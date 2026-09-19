CREATE TABLE IF NOT EXISTS archive_source (
  id INTEGER PRIMARY KEY CHECK (id = 1), identity TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT PRIMARY KEY,
  pageviews INTEGER NOT NULL CHECK (pageviews >= 0),
  visits INTEGER NOT NULL CHECK (visits >= 0),
  sample_interval REAL,
  captured_at TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload))
);
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_attempt TEXT,
  last_success TEXT,
  last_error TEXT
);
