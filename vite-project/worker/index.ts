import { D1Database, ExecutionContext, ScheduledController } from "@cloudflare/workers-types";

import { subscribe } from "./routes/subscribe";
import vapid_public_key from "./routes/vapid_public_key";
import { createNewReminder } from "./routes/create_new_reminder";
import { processDueReminders } from "./jobs/processDueReminders";

export interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (
      url.pathname === "/api/push/vapid_public_key" &&
      request.method === "GET"
    ) {
      return vapid_public_key(env);
    }
    if (url.pathname === "/api/push/subscribe" && request.method === "POST") {
      return subscribe(request, env);
    }
    if (
      url.pathname == "/api/create_new_reminder" &&
      request.method === "POST"
    ) {
      return createNewReminder(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext){
    console.log("aaa")
    ctx.waitUntil(
        processDueReminders(env)
    )
  }
};
