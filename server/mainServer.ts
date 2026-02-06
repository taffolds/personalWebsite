import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userApp from "./userServer.js";
import friendshipApp from "./friendshipServer.js";
// remember serveStatic when going to production
// import { serveStatic } from "@hono/node-server/serve-static";

// https://medium.com/@vivekg312003/understanding-about-orchestration-29a2b6b67fee

import dotenv from "dotenv";

dotenv.config();

export function createApp() {
  const app = new Hono();

  app.route("/api/user", userApp);
  app.route("/api/friendship", friendshipApp);

  return app;
}

const app = createApp();

app.onError((e, c) => {
  return c.json(
    {
      success: false,
      message: "Internal Server Error",
    },
    500,
  );
});

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: port,
});
