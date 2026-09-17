export type CreateReminderInput = {
  userId: string;
  body: string;
  tags: string[];
  dueAt: number;
  repeatInterval: number;
};

export async function createReminder(
  input: CreateReminderInput,
): Promise<void> {
  const response = await fetch("/api/create_new_reminder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `リマインダーの登録に失敗しました: ${response.status}`,
    );
  }
}
