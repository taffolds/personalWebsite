import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import dotenv from "dotenv";
import {
  createUser,
  findUserByGoogleId,
  getUserById,
  updateNickname,
  updateUserLogin,
} from "./services/userService.js";
import {
  saveRefreshToken,
  getRefreshToken,
  updateTokenLastUsed,
  deleteRefreshToken,
} from "./services/authService.js";
import {
  getGoogleUserProfile,
  getTokenFromCode,
  revokeToken,
  refreshAccessToken,
  startLogin,
} from "./services/oauth.js";

dotenv.config();

const userApp = new Hono();

const frontendUrl = process.env.FRONTEND_URL;

userApp.get("/login/fetchToken", async (c) => {
  const { error_description, code } = c.req.query();
  if (error_description) return c.text(error_description);
  if (!code) return c.text("Error: Code param is missing");

  const token = await getTokenFromCode(code);
  if (!token.access_token) throw new Error("Error: No access token");

  const googleRes = await getGoogleUserProfile(token.access_token);

  let user = await findUserByGoogleId(googleRes.sub);

  if (!user) {
    user = await createUser(googleRes.sub, googleRes.email);
  } else {
    await updateUserLogin(user.id);
  }

  if (token.refresh_token) {
    await saveRefreshToken(user!.id, token.refresh_token);
  }

  setCookie(c, "token", token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60,
    path: "/",
  });

  if (!user) throw new Error("Failed to persist user");

  setCookie(c, "user_id", String(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.redirect(`${frontendUrl}/profile`);
});

// REMEMBER TO LIMIT AMOUNT OF LOGIN ATTEMPTS OVER A TIME PERIOD LATER
// HTTP STATUS 429 Too Many Requests
userApp.get("/login/start", async (c) => {
  const authorizationUri = await startLogin();
  return c.redirect(authorizationUri);
});

userApp.get("/profile", async (c) => {
  let token: string | null = getCookie(c, "token") ?? null;
  const userId = getCookie(c, "user_id");

  if (!token && userId) {
    token = await tryTokenRefresh(c, Number(userId));
  }

  if (!token) {
    return c.json(null);
  }

  const user = await getGoogleUserProfile(token);
  return c.json(user.email);
});

async function tryTokenRefresh(c: any, userId: number): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken(userId);
    if (!refreshToken) return null;

    const newAccessToken = await refreshAccessToken(refreshToken);

    await updateUserLogin(userId);
    await updateTokenLastUsed(userId);

    setCookie(c, "token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    await deleteRefreshToken(userId).catch((cleanupError) => {
      console.error("Failed to delete dead refresh token:", cleanupError);
    });
    return null;
  }
}

userApp.get("/logout/start", async (c) => {
  const token = getCookie(c, "token");
  const userId = getCookie(c, "user_id");

  if (token) {
    await revokeToken(token).catch((error) =>
      console.error("Failed to revoke token:", error),
    );
  }

  if (userId) {
    await deleteRefreshToken(Number(userId)).catch((error) =>
      console.error("Failed to delete refresh token from db:", error),
    );
  }
  deleteCookie(c, "token", { path: "/" });
  deleteCookie(c, "user_id", { path: "/" });
  return c.redirect(`${frontendUrl}/logout`);
});

userApp.patch("/nickname", async (c) => {
  const userId = getCookie(c, "user_id");

  if (!userId) return c.json("Couldn't validate user", 401);

  const user = await getUserById(Number(userId));

  if (!user) {
    return c.json("User not found", 401);
  }

  const { nickname } = await c.req.json();

  if (!nickname) {
    return c.json("Need a nickname", 400);
  }

  const res = await updateNickname(user!.id, nickname);

  if (res.error) {
    // consider refactoring this
    switch (res.error) {
      case "Nickname taken": // Not the biggest fan of the names either, frontend will require
        return c.json(res.error, 409); // something a bit more fancy than this anyway
      case "Too many characters":
        return c.json(res.error, 400);
      case "Only characters and digits":
        return c.json(res.error, 400);
      default: // Not testing this until I've refactored
        return c.json("If this pops up who knows", 500);
    }
  }

  return c.json("Nickname updated", 200);
});

export default userApp;
