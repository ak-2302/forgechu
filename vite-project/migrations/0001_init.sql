-- Migration number: 0001 	 2026-09-16T04:03:54.806Z
CREATE TABLE push_subscriptions (
  endpoint TEXT PRIMARY KEY NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);