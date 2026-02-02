import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function findUserByGoogleId(googleId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId));

  return user || null;
}

export async function createUser(googleId: string, email: string) {
  const [user] = await db
    .insert(users)
    .values({
      googleId,
      email,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning();

  return user || null;
}

export async function updateUserLogin(userId: number) {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return user || null;
}

export async function updateNickname(userId: number, newNickname: string) {
  if (newNickname.length > 20)
    return { success: false, error: "Too many characters" };
  const existingNickname = await getNickname(newNickname);
  if (existingNickname) {
    return { success: false, error: "Nickname taken" };
  }
  await db
    .update(users)
    .set({ nickname: newNickname })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function getNickname(checkName: string): Promise<string | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.nickname, checkName));

  return user?.nickname ?? null;
}
