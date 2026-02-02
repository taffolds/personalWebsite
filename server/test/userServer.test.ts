import { describe, it, expect, vi, afterEach } from "vitest";
import userApp from "../userServer.js";
import * as oauth from "../services/oauth.js";
import * as userService from "../services/userService.js";
import * as authService from "../services/authService.js";
import { findUserByGoogleId } from "../services/userService.js";
import { createTestUser } from "./helper.js";

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
    it("should return error if code is mssing", async () => {
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
      expect(cookies).toContain("token=");
      expect(cookies).toContain("user_id=");
      expect(cookies).toContain("HttpOnly; Secure");
    });
    it("should save refresh token", async () => {
      vi.spyOn(oauth, "getTokenFromCode").mockResolvedValue({
        access_token: "token",
        refresh_token: "refresh",
      });

      vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
        sub: "googleId",
        email: "someone@gmail.com",
      });

      const saveRefreshSpy = vi.spyOn(authService, "saveRefreshToken");

      await userApp.request("/login/fetchToken?code=ccc");

      expect(saveRefreshSpy).toHaveBeenCalledWith(
        expect.any(Number),
        "refresh",
      );
    });
  });
});

describe("validation stuff: Get /profile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return user email when authenticated", async () => {
    vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
      sub: "meId",
      email: "meMail@gmail.com",
    });

    const res = await userApp.request("/profile", {
      headers: {
        Cookie: "token=valid_access_token",
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBe("meMail@gmail.com");
  });

  it("should return null when not authenticated", async () => {
    const res = await userApp.request("/profile");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it("should refresh token if user exists from before", async () => {
    const user = await createTestUser();
    await authService.saveRefreshToken(user.id, "refresh");

    vi.spyOn(authService, "getRefreshToken").mockResolvedValue("refresh");
    vi.spyOn(oauth, "refreshAccessToken").mockResolvedValue("token");
    vi.spyOn(oauth, "getGoogleUserProfile").mockResolvedValue({
      sub: user.googleId,
      email: user.email,
    });

    const updateLoginSpy = vi.spyOn(userService, "updateUserLogin");
    const updateTokenSpy = vi.spyOn(authService, "updateTokenLastUsed");

    const res = await userApp.request("/profile", {
      headers: {
        Cookie: `user_id=${user.id}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBe(user.email);

    expect(updateLoginSpy).toHaveBeenCalledWith(user.id);
    expect(updateTokenSpy).toHaveBeenCalledWith(user.id);

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toContain("token=token"); // Is it unclear keeping earlier naming convention?...
  });

  it("should return null if refresh token is missing", async () => {
    const user = await createTestUser();
    vi.spyOn(authService, "getRefreshToken").mockResolvedValue(null);

    const res = await userApp.request("/profile", {
      headers: {
        Cookie: `user_id=${user.id}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it("should return null if token refresh fails", async () => {
    const user = await createTestUser();
    await authService.saveRefreshToken(user.id, "failureToken");

    vi.spyOn(authService, "getRefreshToken").mockResolvedValue("failureToken");
    vi.spyOn(oauth, "refreshAccessToken").mockRejectedValue(
      new Error("Invalid refresh token"),
    );

    const res = await userApp.request("/profile", {
      headers: {
        Cookie: `user_id${user.id}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});

// 204 for Deleted
