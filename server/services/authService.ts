import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { encryptToken, decryptToken } from "../utils/tokens.js";

export async function saveRefreshToken(userId: number, token: string) {
  const encryptedToken = encryptToken(token);

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  await db.insert(refreshTokens).values({
    userId: userId,
    token: encryptedToken,
    createdAt: new Date(),
  });
}

export async function getRefreshToken(userId: number): Promise<string | null> {
  const [res] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId));

  if (!res) return null;

  return decryptToken(res.token);
}

export async function updateTokenLastUsed(userId: number) {
  await db
    .update(refreshTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
}

export async function deleteRefreshToken(userId: number) {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
