export async function subscribePush() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notification permission not granted");
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });
    await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
    });
}