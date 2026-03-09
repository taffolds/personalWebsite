import { createUser, updateNickname } from "../services/userService.js";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { friendships, games } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function createTestUser(googleId?: string, email?: string) {
  const uniqueId = nanoid(10);

  const user = await createUser(
    googleId ?? `testId-${uniqueId}`,
    email ?? `test-${uniqueId}@gmail.com`,
  );
  if (!user) throw new Error("Failed to create test user");
  return user;
}

export async function setNicknameTestUser(userId: number, nickname: string) {
  await updateNickname(userId, nickname);
}

export async function createTestFriendship(userId1: number, userId2: number) {
  const ids = [userId1, userId2].sort((a, b) => a - b);

  const friendship = await db
    .insert(friendships)
    .values({
      userId1: ids[0] as number,
      userId2: ids[1] as number,
      createdAt: new Date(),
    })
    .returning();

  if (!friendship[0]) throw new Error("Failed to create test friendship");
  return friendship[0];
}

export async function createTestGame(
  userId1: number,
  userId2: number,
  firstMover: number,
) {
  const ids = [userId1, userId2].sort((a, b) => a - b);

  const game = await db
    .insert(games)
    .values({
      playerOneId: ids[0] as number,
      playerTwoId: ids[1] as number,
      firstMove: firstMover,
      createdAt: new Date(),
    })
    .returning();

  if (!game[0]) throw new Error("Failed to create test game");
  return game[0];
}

export async function alterTestGame(
  gameId: number,
  status: "in_progress" | "completed" | "draw" | "forfeited",
) {
  await db
    .update(games)
    .set({
      status: status,
    })
    .where(eq(games.id, gameId));
}
