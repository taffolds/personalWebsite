import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import dotenv from "dotenv";
import {
  createUser,
  findUserByGoogleId,
  getRefreshToken,
  storeRefreshToken,
  updateRefreshTokenLastUsedAt,
  updateUserLogin,
  deleteRefreshToken,
} from "./services/userService.js";
import { encryptToken, decryptToken } from "./utils/tokens.js";

dotenv.config();

const userApp = new Hono();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;
const frontendUrl = process.env.FRONTEND_URL;

const infiniteRefreshTokens = process.env.INFINITE_REFRESH_TOKENS;

userApp.get("/login/fetchToken", async (c) => {
  const { error_description, code } = c.req.query();
  if (error_description) return c.text(error_description);
  if (!code) return c.text("Error: Code param is missing");

  if (!googleClientSecret) return c.text("Error: Client secret missing");
  if (!googleClientId) return c.text("Error: Client ID is missing");

  const { token_endpoint, userinfo_endpoint } = await getDiscoveryDoc();

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      grant_type: "authorization_code",
      client_secret: googleClientSecret,
      redirect_uri: `${baseUrl}/api/user/login/fetchToken`,
    }),
  });

  const responseJson = await res.json();
  const { access_token, refresh_token } = responseJson;
  if (!access_token) return c.json(responseJson);

  const userRes = await fetch(userinfo_endpoint, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const googleRes = await userRes.json();

  let user = await findUserByGoogleId(googleRes.sub);

  if (!user) {
    user = await createUser(googleRes.sub, googleRes.email);
  } else {
    await updateUserLogin(user.id);
  }

  if (refresh_token) {
    const encrypted = encryptToken(refresh_token);
    await storeRefreshToken(user!.id, encrypted);
  }

  setCookie(c, "token", access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60,
    // maxAge: 30, // For the love of Code remember to change this after manual testing
    path: "/",
  });

  setCookie(c, "user_id", String(user!.id), {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.redirect(`${frontendUrl}/profile`);
});

async function getDiscoveryDoc() {
  const res = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration",
  );
  return await res.json();
}

// REMEMBER TO LIMIT AMOUNT OF LOGIN ATTEMPTS OVER A TIME PERIOD LATER
userApp.get("/login/start", async (c) => {
  const { authorization_endpoint } = await getDiscoveryDoc();
  if (!googleClientId) return c.text("Error: Missing Google Client ID");

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${baseUrl}/api/user/login/fetchToken`,
    response_type: "code",
    scope: "openid email",
    access_type: "offline",
  });

  if (infiniteRefreshTokens) {
    params.append("prompt", infiniteRefreshTokens);
  }

  const authorizationUri = `${authorization_endpoint}?${params.toString()}`;

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

  const { userinfo_endpoint } = await getDiscoveryDoc();

  const res = await fetch(userinfo_endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  return c.json(data.email);
});

async function tryTokenRefresh(c: any, userId: number): Promise<string | null> {
  const encryptedToken = await getRefreshToken(userId);
  if (!encryptedToken) return null;

  const refreshToken = decryptToken(encryptedToken);

  if (!refreshToken) return null;

  const { token_endpoint } = await getDiscoveryDoc();

  if (!googleClientId) {
    console.error("Error: Missing client id");
    return null;
  }
  if (!googleClientSecret) {
    console.error("Error: Missing client secret");
    return null;
  }

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();

  if (data.access_token) {
    await updateUserLogin(userId);
    await updateRefreshTokenLastUsedAt(userId);

    setCookie(c, "token", data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60,
      // maxAge: 30, // And here, don't forget this, or I'll shoot myself in the foot and get a headache
      path: "/",
    });

    return data.access_token;
  }

  return null;
}

userApp.get("/logout/start", async (c) => {
  const token = getCookie(c, "token");
  const userId = getCookie(c, "user_id");

  if (token) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ token }),
    });
  }

  if (userId) {
    await deleteRefreshToken(Number(userId));
  }
  deleteCookie(c, "token", { path: "/" });
  deleteCookie(c, "user_id", { path: "/" });
  return c.redirect(`${frontendUrl}/logout`);
});

export default userApp;
