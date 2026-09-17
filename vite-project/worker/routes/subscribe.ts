import { Env } from "../index";



interface PushSubscriptionBody {
    endpoint: string;
    expirationTime?: number | null;
    keys?: {
        p256dh?: string;
        auth?: string;
    };
}
type Body = {
    userId: string;
    subscription: PushSubscriptionBody;
}

export async function subscribe(request: Request, env: Env): Promise<Response> {
    let body: Body;
    try {
        body = await request.json();
    } catch{
        return new Response("Invalid JSON", { status: 400 });
    }
    const { userId, subscription } = body;
    const { endpoint, keys } = subscription;
    if (!userId) {
        return new Response("Missing userId", { status: 400 });
    }
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return new Response("Missing required fields", { status: 400 });
    }
    await env.DB.prepare(`
INSERT INTO push_subscriptions (endpoint, p256dh,user_id, auth, created_at)
VALUES (?, ?, ?, ?, ?)

ON CONFLICT(endpoint) DO UPDATE SET
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    user_id = excluded.user_id
`
    ).bind(endpoint, keys.p256dh, userId, keys.auth, Date.now())
        .run();
    return new Response("Subscription saved", { status: 201 });
}