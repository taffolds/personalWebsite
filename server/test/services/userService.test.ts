import { describe, it, expect } from "vitest";
import {
  createUser,
  findUserByGoogleId,
  updateUserLogin,
  getByUserId,
} from "../../services/userService.js";
import { createTestUser } from "../helper.js";

// TS complains about user possibly being null, therefore the checks:
// expect(user).not.toBeNull();

describe("Create user", () => {
  it("Should create new user", async () => {
    const user = await createTestUser();

    expect(user).not.toBeNull();
    expect(user!.id).toBeGreaterThan(0);

    expect(user!.id).toBeDefined();
    expect(user!.googleId).toBeTruthy();
    expect(user!.email).toContain("@gmail.com");
    expect(user!.nickname).toBeNull();
    expect(user!.createdAt).toBeInstanceOf(Date);
  });

  it("Should create user with hardcoded values", async () => {
    const gId = "googleId";
    const gm = "g@m.c";

    const user = await createUser(gId, gm);

    expect(user).not.toBeNull();
    expect(user!.googleId).toBe(gId);
    expect(user!.email).toBe(gm);
  });

  it("Should set lastLoginAt when creating new user", async () => {
    const user = await createTestUser();

    expect(user).not.toBeNull();
    expect(user!.lastLoginAt).toBeInstanceOf(Date);
  });
});

describe("Find user by Google Id", () => {
  it("should find existing user", async () => {
    const newUser = await createTestUser();

    const persistedUser = await findUserByGoogleId(newUser.googleId);

    expect(persistedUser).not.toBeNull();
    expect(persistedUser!.id).toBe(newUser.id);
    expect(persistedUser!.googleId).toBe(newUser.googleId);
    expect(persistedUser!.email).toBe(newUser.email);
  });

  it("Should return null if user !exists", async () => {
    const noOne = await findUserByGoogleId("unrealMan");

    expect(noOne).toBeNull();
  });
});

describe("Updated user login time", () => {
  it("should update lastLoginTimestamp", async () => {
    const user = await createTestUser();
    expect(user).not.toBeNull();

    const originalLoginTime = user!.lastLoginAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    await updateUserLogin(user!.id);

    const newLogin = await getByUserId(user!.id);
    expect(newLogin).not.toBeNull();
    expect(newLogin!.lastLoginAt).not.toEqual(originalLoginTime);
  });
});

describe("Get User by Id", () => {
  it("should return user by id", async () => {
    const newUser = await createTestUser();
    expect(newUser).not.toBeNull();

    const persistedUser = await getByUserId(newUser!.id);

    expect(persistedUser).not.toBeNull();
    expect(persistedUser!.googleId).toBe(newUser.googleId);
  });

  it("Should return null for invalid id", async () => {
    const hideAndSeekWithGhosts = await getByUserId(1000);

    expect(hideAndSeekWithGhosts).toBeNull();
  });
});
