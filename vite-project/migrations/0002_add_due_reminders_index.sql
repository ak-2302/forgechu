-- Due reminder scans run once per minute in the prototype.
CREATE INDEX IF NOT EXISTS idx_reminder_notes_due
ON reminder_notes(is_done, next_remind_at);
