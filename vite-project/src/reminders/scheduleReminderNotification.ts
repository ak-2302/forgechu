import { getUserId, subscribePush } from '../push/subscribe';
import { createReminder } from './createReminder';

const REMINDER_DELAY_MS = 60_000;

export function scheduleReminderNotification(body: string, tags: string[]): void {
  const reminderInput = {
    userId: getUserId(),
    body,
    tags,
    dueAt: Date.now() + REMINDER_DELAY_MS,
    repeatInterval: 0,
  };

  void subscribePush()
    .then(() => createReminder(reminderInput))
    .catch((error: unknown) => {
      console.error('通知の登録に失敗しました', error);

    });
}
