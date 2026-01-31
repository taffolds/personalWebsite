import { afterEach } from "vitest";
import { db } from "../db/index.js";
import {
  users,
  refreshTokens,
  blocks,
  friendships,
  friendRequests,
  gameRequests,
  games,
} from "../db/schema.js";
import dotenv from "dotenv";

dotenv.config();

afterEach(async () => {
  await db.delete(games);
  await db.delete(gameRequests);
  await db.delete(friendRequests);
  await db.delete(friendships);
  await db.delete(blocks);
  await db.delete(refreshTokens);
  await db.delete(users);
});
