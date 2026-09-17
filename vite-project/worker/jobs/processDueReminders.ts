import { Env } from "..";
import { sendReminderPush } from "../push/sendPush";

export async function processDueReminders(env: Env) {
  const now = Date.now();
  const dueReminders = await env.DB.prepare(
    "SELECT id,user_id,body,tags,repeat_interval FROM reminder_notes WHERE next_remind_at <= ? AND is_done = 0",
  )
    .bind(now)
    .all<{
      id: number;
      user_id: number;
      body: string;
      repeat_interval: number;
    }>();
  for (const reminder of dueReminders.results) {
    await sendReminderPush(
      env,
      reminder.user_id.toString(),
      "Reminder",
      reminder.body,
    );
    if (reminder.repeat_interval <= 0) {
      await env.DB.prepare("UPDATE reminder_notes SET is_done = 1 WHERE id = ?")
        .bind(reminder.id)
        .run();
    } else {
      const nextRemindAt =
        reminder.repeat_interval > 0 ? now + reminder.repeat_interval : null;
      await env.DB.prepare(
        "UPDATE reminder_notes SET last_remind_at = ?, next_remind_at = ? WHERE id = ?",
      )
        .bind(now, nextRemindAt, reminder.id)
        .run();
    }
  }
}
