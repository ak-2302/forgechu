type VapidPublicKeyResponse = {
  publicKey?: unknown;
};

type SubscriptionRequestBody = {
  userId: string;
  subscription: PushSubscription;
};

function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
}

async function getVapidPublicKey(): Promise<string> {
  const response = await fetch("/api/push/vapid_public_key");

  if (!response.ok) {
    throw new Error(`VAPID公開鍵の取得に失敗しました: ${response.status}`);
  }

  const data = (await response.json()) as VapidPublicKeyResponse;

  if (typeof data.publicKey !== "string" || data.publicKey.length === 0) {
    throw new Error("VAPID公開鍵の形式が正しくありません");
  }

  return data.publicKey;
}

async function saveSubscription(body: SubscriptionRequestBody): Promise<void> {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`購読情報の保存に失敗しました: ${response.status}`);
  }
}

export function getUserId(): string {
  let userId = localStorage.getItem("user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);
  }

  return userId;
}

export async function subscribePush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("このブラウザはPush通知に対応していません");
  }

  // メモ保存のsubmitイベントから、ネットワーク通信より先に呼び出す。
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("通知が許可されませんでした");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await getVapidPublicKey();

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await saveSubscription({
    userId: getUserId(),
    subscription,
  });

  return subscription;
}
