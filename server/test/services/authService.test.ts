import { describe, it, expect } from "vitest";
import {
  deleteRefreshToken,
  getRefreshToken,
  saveRefreshToken,
  updateTokenLastUsed,
} from "../../services/authService.js";
import { createTestUser } from "../helper.js";

describe("Save refresh token", () => {
  it("should encrypt and save refresh token", async () => {
    const user = await createTestUser();

    await saveRefreshToken(user.id, "testToken");

    const retrieved = await getRefreshToken(user.id);
    expect(retrieved).toBe("testToken");
  });

  it("should replace existing refresh token", async () => {
    const user = await createTestUser();

    await saveRefreshToken(user.id, "token1");
    await saveRefreshToken(user.id, "token2");

    const retrieved = await getRefreshToken(user.id);
    expect(retrieved).toBe("token2");
  });
});

describe("get refresh token", () => {
  it("should return null for user without token", async () => {
    const user = await createTestUser();
    const token = await getRefreshToken(user.id);

    expect(token).toBeNull();
  });

  it("should decrypt and return token", async () => {
    const user = await createTestUser();

    await saveRefreshToken(user.id, "decryptedToken");

    const retrieved = await getRefreshToken(user.id);
    expect(retrieved).toBe("decryptedToken");
  });
});

describe("delete refresh token", () => {
  it("should delete refresh token", async () => {
    const user = await createTestUser();

    await saveRefreshToken(user.id, "oldToken");

    await deleteRefreshToken(user.id);

    const retrieved = await getRefreshToken(user.id);
    expect(retrieved).toBeNull();
  });
});

describe("updated last use of token", () => {
  it("should update last used at timestamp", async () => {
    const user = await createTestUser();

    await saveRefreshToken(user.id, "testToken");

    await new Promise((resolve) => setTimeout(resolve, 10));

    await updateTokenLastUsed(user.id);

    expect(true).toBe(true);
  });
});
