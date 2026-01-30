import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import dotenv from "dotenv";
import {
  createUser,
  findUserByGoogleId,
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
    // maxAge: 30, // For the love of Code remember to change this after manual testing
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
      // maxAge: 30, // And here, don't forget this, or I'll shoot myself in the foot and get a headache
      path: "/",
    });

    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
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
      console.error("Failed to revoke refresh token:", error),
    );
  }
  deleteCookie(c, "token", { path: "/" });
  deleteCookie(c, "user_id", { path: "/" });
  return c.redirect(`${frontendUrl}/logout`);
});

export default userApp;
