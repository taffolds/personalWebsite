import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import dotenv from "dotenv";

dotenv.config();

const userApp = new Hono();

const google_client_id = process.env.GOOGLE_CLIENT_ID;
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET;
const base_url = process.env.BASE_URL;
const frontend_url = process.env.FRONTEND_URL;

userApp.get("/login/fetchToken", async (c) => {
  const { error_description, code } = c.req.query();
  if (error_description) return c.text(error_description);
  if (!code) return c.text("Error: Code param is missing");

  let res;
  let accessToken;

  if (!google_client_secret) return c.text("Error: Client secret missing");
  if (!google_client_id) return c.text("Error: Client ID is missing");

  const { token_endpoint } = await getDiscoveryDoc();

  res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: google_client_id,
      grant_type: "authorization_code",
      client_secret: google_client_secret,
      redirect_uri: `${base_url}/api/user/login/fetchToken`,
    }),
  });
  const responseJson = await res.json();
  accessToken = responseJson.access_token;
  if (!accessToken) return c.json(responseJson);

  setCookie(c, "token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60,
    path: "/",
  });
  return c.redirect(`${frontend_url}/profile`);
});

async function getDiscoveryDoc() {
  const res = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration",
  );
  return await res.json();
}

userApp.get("/login/start", async (c) => {
  const { authorization_endpoint } = await getDiscoveryDoc();
  if (!google_client_id) return c.text("Error: Missing Google Client ID");

  const authorizationUri =
    authorization_endpoint +
    "?" +
    new URLSearchParams({
      client_id: google_client_id,
      redirect_uri: `${base_url}/api/user/login/fetchToken`,
      response_type: "code",
      scope: "openid email",
    });
  return c.redirect(authorizationUri);
});

userApp.get("/profile", async (c) => {
  const token = getCookie(c, "token");

  if (!token) {
    return c.json(null);
  }

  let userinfoEndpoint;

  const { userinfo_endpoint } = await getDiscoveryDoc();
  userinfoEndpoint = userinfo_endpoint;

  const res = await fetch(userinfoEndpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  const userInfo = {
    email: data.email,
  };

  return c.json(userInfo);
});

userApp.get("/logout/start", async (c) => {
  const token = getCookie(c, "token");

  if (!token) {
    return c.text("Error: No token found");
  }

  const res = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }),
  });

  if (res.ok) {
    deleteCookie(c, "token");
    return c.redirect(`${frontend_url}/logout`);
  }
});

export default userApp;
