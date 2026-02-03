import { describe, it, expect } from "vitest";
import {
  createUser,
  findUserByGoogleId,
  updateUserLogin,
  getUserById,
  updateNickname,
  deleteUser,
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

    const newLogin = await getUserById(user!.id);
    expect(newLogin).not.toBeNull();
    expect(newLogin!.lastLoginAt).not.toEqual(originalLoginTime);
  });
});

describe("Get User by Id", () => {
  it("should return user by id", async () => {
    const newUser = await createTestUser();
    expect(newUser).not.toBeNull();

    const persistedUser = await getUserById(newUser!.id);

    expect(persistedUser).not.toBeNull();
    expect(persistedUser!.googleId).toBe(newUser.googleId);
  });

  it("Should return null for invalid id", async () => {
    const hideAndSeekWithGhosts = await getUserById(1000);

    expect(hideAndSeekWithGhosts).toBeNull();
  });
});

// should update nickname
// should only allow char and digit
// should not allow duplicate

describe("update nickname", () => {
  it("should update user nickname", async () => {
    const user = await createTestUser();

    await updateNickname(user.id, "customName");

    const updated = await getUserById(user.id);

    expect(updated!.nickname).toBe("customName");
  });

  it("should return error if nickname taken", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await updateNickname(user1.id, "takenNickname");

    const res = await updateNickname(user2.id, "takenNickname");

    expect(res.success).toBe(false);
    expect(res.error).toContain("Nickname taken");
  });

  it("should only allow char and digits", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const disallow1 = await updateNickname(user1.id, "with spaces");
    expect(disallow1.success).toBe(false);
    expect(disallow1.error).toContain("Only characters and digits");

    const disallow2 = await updateNickname(user2.id, "with?!");
    expect(disallow2.success).toBe(false);
    expect(disallow2.error).toContain("Only characters and digits");
  });

  it("should tell user limit is 20 chars", async () => {
    const user = await createTestUser();

    const disallow = await updateNickname(user.id, "012345678901234567890");

    expect(disallow.success).toBe(false);
    expect(disallow.error).toContain("Too many characters");
  });
});

// This really needs refactoring as more functionality gets implemented.
// Need to check every table once I start a new table. So friendships next
describe("delete user", () => {
  it("should delete user from users table", async () => {
    const user = await createTestUser();

    const deleted = await deleteUser(user.id);
    const gone = await getUserById(user.id);

    expect(gone).toBe(null);
    expect(deleted).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it("should throw error when deleting non-existent user", async () => {
    const deleted = await deleteUser(19991999);

    expect(deleted).toBeNull();
  });
});
