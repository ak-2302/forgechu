import { Env } from "..";

type CreateNewReminderBody = {
  userId: string;
  body: string;
  tags: string[];
  dueAt: number;
  repeatInterval: number;
};

export async function createNewReminder(
  request: Request,
  env: Env,
): Promise<Response> {
  let data: CreateNewReminderBody;

  try {
    data = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userId, body: reminderBody, tags, dueAt, repeatInterval } = data;

  if (
    typeof userId !== "string" ||
    userId.trim() === "" ||
    typeof reminderBody !== "string" ||
    reminderBody.trim() === "" ||
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string") ||
    typeof dueAt !== "number" ||
    !Number.isFinite(dueAt) ||
    typeof repeatInterval !== "number" ||
    !Number.isFinite(repeatInterval)
  ) {
    return new Response("Invalid required fields", { status: 400 });
  }

  await env.DB.prepare(
    `
  INSERT INTO reminder_notes (
    user_id,
    body,
    tags,
    created_at,
    due_at,
    next_remind_at,
    last_remind_at,
    is_done,
    repeat_interval
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
  )
    .bind(
      userId,
      reminderBody,
      JSON.stringify(tags),
      Date.now(),
      dueAt,
      dueAt,
      0,
      0,
      repeatInterval,
    )
    .run();

  return new Response("Reminder created", { status: 201 });
}
