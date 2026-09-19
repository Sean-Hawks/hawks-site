-- One browser token may contribute at most one heart to an article.
-- Raw tokens, IP addresses and cross-article visitor identifiers are never stored.
CREATE TABLE hearts (
  article_id TEXT NOT NULL CHECK (length(article_id) BETWEEN 1 AND 256),
  actor_hash TEXT NOT NULL CHECK (length(actor_hash) = 64),
  PRIMARY KEY (article_id, actor_hash)
) WITHOUT ROWID;
