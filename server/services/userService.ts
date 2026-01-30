import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
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

// I'm almost certain I'll need this later
export async function getByUserId(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return user || null;
}

export async function storeRefreshToken(
  userId: number,
  encryptedToken: string,
) {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  await db.insert(refreshTokens).values({
    userId: userId,
    token: encryptedToken,
    createdAt: new Date(),
  });
}

export async function getRefreshToken(userId: number) {
  const [refreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId));

  if (!refreshToken) return null;

  return refreshToken.token || null;
}

export async function updateRefreshTokenLastUsedAt(userId: number) {
  await db
    .update(refreshTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
}

export async function deleteRefreshToken(userId: number) {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
