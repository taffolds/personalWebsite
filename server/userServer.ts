import { Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import dotenv from "dotenv";
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

dotenv.config();

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

userApp.delete("/", async (c) => {
  const userId = await getSignedCookie(c, "user_id");

  if (!userId) return c.json("Cannot delete other users", 401);

  const user = await getUserById(Number(userId));

  if (!user) {
    return c.json("Cannot delete other users", 401);
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
