

export function getUserId(): string {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("user_id", userId);
    }
    return userId;
}   

export async function subscribePush() {

    const response = await fetch("/api/push/vapid_public_key");
    const data = await response.json();
    const applicationServerKey = data.publicKey;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notification permission not granted");
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
    });
    await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId: getUserId(),
            subscription: subscription
        }),
    });
}