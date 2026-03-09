import { Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import {
  createUser,
  findUserByGoogleId,
  getUserById,
  updateNickname,
  updateUserLogin,
  deleteUser,
} from "./services/userService.js";
import {
  getGoogleUserProfile,
  getTokenFromCode,
  startLogin,
} from "./services/oauth.js";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const userApp = new Hono();

const frontendUrl = process.env.FRONTEND_URL;
const cookieSecret = process.env.COOKIE_SECRET!;

if (!cookieSecret) {
  throw new Error("No Cookie Secret");
}

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

  if (!user) throw new Error("Failed to persist user");

  await setSignedCookie(c, "user_id", String(user.id), cookieSecret, {
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
  const userId = await getSignedCookie(c, cookieSecret, "user_id");

  if (!userId) return c.json(null);

  const user = await getUserById(Number(userId));

  if (!user) return c.json(null);

  return c.json({
    id: user.id,
    email: user.email,
    nickname: user.nickname || null,
  });
});

userApp.get("/logout/start", async (c) => {
  deleteCookie(c, "user_id", { path: "/" });
  return c.redirect(`${frontendUrl}/logout`);
});

userApp.patch("/nickname", async (c) => {
  const userId = await getSignedCookie(c, cookieSecret, "user_id");

  if (!userId) return c.json({ message: "Couldn't validate user" }, 401);

  const user = await getUserById(Number(userId));

  if (!user) {
    return c.json({ message: "User not found" }, 401);
  }

  const { nickname } = await c.req.json();

  if (!nickname) {
    return c.json({ message: "Need a nickname" }, 400);
  }

  const res = await updateNickname(user!.id, nickname);

  if (res.error) {
    // consider refactoring this
    switch (res.error) {
      case "Nickname taken":
        return c.json({ message: res.error }, 409);
      case "Nickname can be max 15 characters":
        return c.json({ message: res.error }, 400);
      case "Nickname can only contain characters and digits":
        return c.json({ message: res.error }, 400);
      default: // Not testing this until I've refactored
        return c.json("If this pops up who knows", 500);
    }
  }

  return c.json({ message: "Nickname updated" }, 200);
});

userApp.delete("/delete", async (c) => {
  const userId = await getSignedCookie(c, cookieSecret, "user_id");

  if (!userId) return c.json({ message: "Cannot delete other users" }, 401);

  const user = await getUserById(Number(userId));

  if (!user) {
    return c.json({ message: "Cannot delete other users" }, 401);
  }

  const deletedUser = await deleteUser(user.id);

  if (!deletedUser) {
    return c.json("User not found", 404);
  }

  deleteCookie(c, "token", { path: "/" });
  deleteCookie(c, "user_id", { path: "/" });

  return c.body(null, 204);
});

export default userApp;
