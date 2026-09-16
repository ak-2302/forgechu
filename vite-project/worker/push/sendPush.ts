import {
  buildPushPayload,
  type PushSubscription,
  type PushMessage,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import { Env } from "..";

export async function sendReminderPush(
  env: Env,
  userId: string,
  title: string,
  body: string,
) {
  const { results } = await env.DB.prepare(
    `
SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
  )
    .bind(userId)
    .all<{ endpoint: string; p256dh: string; auth: string }>();
  const row = results[0];
  const subscription: PushSubscription = {
    endpoint: row.endpoint,
    expirationTime: null,

    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
  const message: PushMessage = {
    data: "aaa"
  };
  const vapidKeys: VapidKeys = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  };
  const payload = await buildPushPayload(message, subscription, vapidKeys);
  await fetch(subscription.endpoint, payload);
}
