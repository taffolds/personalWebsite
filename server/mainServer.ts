import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userApp from "./userServer.js";
import friendshipApp from "./friendshipServer.js";
import gameApp from "./gameServer.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { serveStatic } from "@hono/node-server/serve-static";

// https://medium.com/@vivekg312003/understanding-about-orchestration-29a2b6b67fee

import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

app.get("/health", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);

    return c.json(
      {
        status: "healthy",
        database: "connected",
      },
      200,
    );
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: "Database connection failed",
      },
      503,
    );
  }
});

app.route("/api/user", userApp);
app.route("/api/friendship", friendshipApp);
app.route("/api/games", gameApp);

app.onError((e, c) => {
  return c.json(
    {
      success: false,
      message: "Internal Server Error",
    },
    500,
  );
});

if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "../dist" }));
}

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: port,
  hostname: "0.0.0.0", // For mobile development
});
