import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userApp from "./userServer.js";
// remember serveStatic when going to production
// import { serveStatic } from "@hono/node-server/serve-static";

import dotenv from "dotenv";

dotenv.config();

export function createApp() {
  const app = new Hono();

  app.route("/api/user", userApp);

  return app;
}

const app = createApp();

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: port,
});
