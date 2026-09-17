import { Env } from "..";

export default async function vapid_public_key(env: Env): Promise<Response> {
  const publicKey = env.VAPID_PUBLIC_KEY;
  return Response.json({ publicKey: publicKey });
}
