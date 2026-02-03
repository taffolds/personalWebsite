import { createUser, updateNickname } from "../services/userService.js";
import { nanoid } from "nanoid";

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
