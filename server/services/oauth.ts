import dotenv from "dotenv";

dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;

export async function getDiscoveryDoc() {
  const res = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration",
  );
  return await res.json();
}

export async function getTokenFromCode(code: string) {
  if (!googleClientSecret || !googleClientId) {
    throw new Error("Error: Missing oauth env variables");
  }

  const { token_endpoint } = await getDiscoveryDoc();

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

  return await res.json();
}

export async function getGoogleUserProfile(token: string) {
  const { userinfo_endpoint } = await getDiscoveryDoc();
  const res = await fetch(userinfo_endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

export async function revokeToken(token: string) {
  const res = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }),
  });

  return res.ok;
}
