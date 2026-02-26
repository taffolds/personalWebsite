import { createUser, updateNickname } from "../services/userService.js";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { friendships } from "../db/schema.js";

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
