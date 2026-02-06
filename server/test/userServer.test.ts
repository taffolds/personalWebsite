import { describe, it, expect, vi, afterEach } from "vitest";
import userApp from "../userServer.js";
import * as oauth from "../services/oauth.js";
import * as userService from "../services/userService.js";
import { findUserByGoogleId } from "../services/userService.js";
import { createTestUser, setNicknameTestUser } from "./helper.js";

vi.mock("hono/cookie", async () => {
  const actual = await vi.importActual("hono/cookie");
  return {
    ...actual,
    getSignedCookie: vi.fn(),
  };
});

import { getSignedCookie } from "hono/cookie";

describe("login stuff", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("GET /login/start", () => {
    it("should redirect to oauth url", async () => {
      const mockAuthUrl = "https://oauth.fakeurl.com";
      vi.spyOn(oauth, "startLogin").mockResolvedValue(mockAuthUrl);

      const res = await userApp.request("/login/start");

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(mockAuthUrl);
    });
  });
  describe("Get /login/fetchToken", () => {
    it("should return error if code is missing", async () => {
      const res = await userApp.request("/login/fetchToken");
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("Code param is missing");
    });

    it("should create new user and redirect", async () => {
      vi.spyOn(oauth, "getTokenFromCode").mockResolvedValue({
        access_token: "token",
        refresh_token: "refresh",
      });

      vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
        sub: "fakeGId",
        email: "mrEmail@gmail.com",
      });

      const createUserSpy = vi.spyOn(userService, "createUser");

      const res = await userApp.request("/login/fetchToken?code=aaa");

      expect(res.status).toBe(302);

      expect(createUserSpy).toHaveBeenCalledWith(
        "fakeGId",
        "mrEmail@gmail.com",
      );

      const user = await findUserByGoogleId("fakeGId");
      expect(user).not.toBeNull();
      expect(user!.email).toBe("mrEmail@gmail.com");
    });

    it("should update existing user on repeat login", async () => {
      const existingUser = await createTestUser(
        "oldFriendId",
        "oldFriend@gmail.com",
      );

      vi.spyOn(oauth, "getTokenFromCode").mockResolvedValue({
        access_token: "token",
        refresh_token: "refresh",
      });

      vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
        sub: "oldFriendId",
        email: "oldFriend@gmail.com",
      });

      const updateLoginSpy = vi.spyOn(userService, "updateUserLogin");

      const res = await userApp.request("/login/fetchToken?code=aaa");

      expect(res.status).toBe(302);

      expect(updateLoginSpy).toHaveBeenCalledWith(existingUser.id);
    });

    it("should set cookies on login", async () => {
      vi.spyOn(oauth, "getTokenFromCode").mockResolvedValue({
        access_token: "token",
        refresh_token: "refresh",
      });

      vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
        sub: "cookieId",
        email: "omnom@gmail.com",
      });

      const res = await userApp.request("/login/fetchToken?code=bbb");

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("user_id=");
      expect(cookies).toContain("HttpOnly; Secure");
    });
  });
});

describe("validation stuff: Get /profile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return user email when authenticated", async () => {
    const user = await createTestUser("fakeId", "meMail@gmail.com");
    await setNicknameTestUser(user.id, "mrRandom");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await userApp.request("/profile");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("meMail@gmail.com");
    expect(body.nickname).toBe("mrRandom");
  });

  it("should return null when not authenticated", async () => {
    const res = await userApp.request("/profile");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});

describe("log out: Get /logout/start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should clear cookie and redirect", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await userApp.request("/logout/start");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/logout");

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toBeTruthy();
    expect(cookies).toContain("user_id=");
  });
});

describe("change nicknames: Patch /nickname", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return ok for valid nickname", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "newName" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toContain("Nickname updated");
  });

  it("should tell the user nickname already taken", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    vi.spyOn(userService, "updateNickname").mockResolvedValue({
      success: false,
      error: "Nickname taken",
    });

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "taken" }),
    });

    expect(res.status).toBe(409);

    const errorMessage = await res.json();
    expect(errorMessage).toContain("Nickname taken");
  });

  it("should tell the user off for not entering anything", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);

    const errorMessage = await res.json();
    expect(errorMessage).toContain("Need a nickname");
  });

  it("should display error too many characters", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    vi.spyOn(userService, "updateNickname").mockResolvedValue({
      success: false,
      error: "Too many characters",
    });

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "012345678901234567890" }),
    });

    expect(res.status).toBe(400);

    const errorMessage = await res.json();
    expect(errorMessage).toContain("Too many characters");
  });

  it("should display error only char digits", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    vi.spyOn(userService, "updateNickname").mockResolvedValue({
      success: false,
      error: "Only characters and digits",
    });

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "what?!" }),
    });

    expect(res.status).toBe(400);

    const errorMessage = await res.json();
    expect(errorMessage).toBe("Only characters and digits");
  });

  it("detects some funny business", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await userApp.request("/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "intruder" }),
    });

    expect(res.status).toBe(401);

    const errorMessage = await res.json();
    expect(errorMessage).toBe("Couldn't validate user");
  });
});

// 204 for Deleted
describe("delete user: Delete /", () => {
  // is this really a separate endpoint? think about it
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return ok deleted user", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await userApp.request("/", {
      method: "DELETE",
    });

    expect(res.status).toBe(204);
  });
  it("should detect postman funny business", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await userApp.request("/", {
      method: "DELETE",
    });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toBe("Cannot delete other users");
  });
});
