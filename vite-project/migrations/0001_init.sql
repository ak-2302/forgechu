-- Migration number: 0001 	 2026-09-16T04:03:54.806Z
CREATE TABLE push_subscriptions (
  endpoint TEXT PRIMARY KEY NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

CREATE TABLE reminder_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    due_at INTEGER NOT NULL,
    next_remind_at INTEGER NOT NULL,
    last_remind_at INTEGER,
    is_done INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
    repeat_interval INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_reminder_notes_user_id ON reminder_notes(user_id);
