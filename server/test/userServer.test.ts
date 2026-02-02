import { describe, it, expect, vi, afterEach } from "vitest";
import userApp from "../userServer.js";
import * as oauth from "../services/oauth.js";
import * as userService from "../services/userService.js";
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
  });
});

// 204 for Deleted
