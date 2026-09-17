import {
  buildPushPayload,
  type PushSubscription,
  type PushMessage,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import { Env } from "..";

export type PushDeliveryResult =
  | "sent"
  | "no_subscription"
  | "subscription_expired";

export async function sendReminderPush(
  env: Env,
  userId: string,
  title: string,
  body: string,
): Promise<PushDeliveryResult> {
  const { results } = await env.DB.prepare(
    `
SELECT endpoint, p256dh, auth
FROM push_subscriptions
WHERE user_id = ?
`,
  )
    .bind(userId)
    .all<{ endpoint: string; p256dh: string; auth: string }>();

  const row = results[0];

  if (!row) {
    return "no_subscription";
  }

  const subscription: PushSubscription = {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };

  const message: PushMessage = {
    data: JSON.stringify({
      title,
      body,
      url: "/",
    }),
    options: {
      ttl: 60 * 60 * 24,
      urgency: "high",
    },
  };

  const vapidKeys: VapidKeys = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  };

  const payload = await buildPushPayload(message, subscription, vapidKeys);

  const response = await fetch(subscription.endpoint, payload);

  if (response.status === 404 || response.status === 410) {
    await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
      .bind(subscription.endpoint)
      .run();

    return "subscription_expired";
  }

  if (!response.ok) {
    throw new Error(
      `Push送信に失敗しました: ${response.status} ${response.statusText}`,
    );
  }

  return "sent";
}
