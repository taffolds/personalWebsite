import { Hono } from "hono";
import { getUserById } from "./services/userService.js";
import { getSignedCookie } from "hono/cookie";
import {
  confirmFriendship,
  displayAllFriends,
  removeFriendRequest,
  removeFriendship,
  searchForUsers,
  sendFriendRequest,
  showAllFriendRequests,
  showPendingRequests,
} from "./services/friendshipService.js";

const friendshipApp = new Hono();

// Needs a good refactor
const cookieSecret = process.env.COOKIE_SECRET!;

if (!cookieSecret) {
  throw new Error("No Cookie Secret");
}

type ValidationResult =
  | { error: string; status: number } // is the "as any" fix alright? I always send a status
  | { user: { id: number; nickname: string | null } };

async function validateUserDetails(c: any): Promise<ValidationResult> {
  const userIdAsString = await getSignedCookie(c, cookieSecret, "user_id");
  if (!userIdAsString) return { error: "Not authenticated", status: 401 };

  const userId = Number(userIdAsString);
  const user = await getUserById(userId);

  if (!user) return { error: "User not found", status: 404 };

  if (!user.nickname)
    return { error: "Need to set a nickname to access resource", status: 403 };

  return { user };
}

friendshipApp.get("/search", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser && "status" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const searchNickname = c.req.query("query");
  if (!searchNickname)
    return c.json("Search field has to contain something", 400);
  const res = await searchForUsers(searchNickname);

  return c.json(res, 200);
});

friendshipApp.post("/requests/send", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { nickname } = await c.req.json();

  if (!nickname)
    return c.json("Need to set a nickname to access resource", 400); // Faulty debug message

  const sentRequest = await sendFriendRequest(
    validatedUser!.user!.id,
    nickname,
  );

  // Terrible, but the odds of anything else happening here are minimal
  if (!sentRequest) return c.json("Attempted duplicate friend request", 409);

  return c.json({ message: "Friend request sent" }, 201);
});

friendshipApp.get("/requests/outgoing", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const outgoingRequests = await showPendingRequests(validatedUser.user.id);
  return c.json({ outgoingRequests: outgoingRequests }, 200);
});

friendshipApp.get("/requests/incoming", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const requests = await showAllFriendRequests(validatedUser.user.id);
  return c.json(requests, 200);
});

friendshipApp.post("/requests/accept", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { requestId } = await c.req.json();
  if (!requestId) return c.json("Need to send have a requestId", 400);

  const requests = await showAllFriendRequests(validatedUser.user.id);
  const request = requests.find((r) => r.requestId === requestId);

  if (!request) return c.json("Must have request to be friends", 404);
  const friendship = await confirmFriendship(
    request.requestId,
    validatedUser.user.id,
  );

  if (!friendship) return c.json("Must have request to be friends", 404);

  return c.json("Friendship Created", 201);
});

friendshipApp.delete("/requests/delete", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { requestId } = await c.req.json();
  if (!requestId) return c.json("Need to send have a requestId", 400);

  const removed = await removeFriendRequest(requestId, validatedUser.user.id);
  if (!removed) return c.json("Not your request to delete", 401);
  return c.json("Request deleted", 200);
});

friendshipApp.get("/friends", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const friends = await displayAllFriends(validatedUser.user.id);
  return c.json(friends, 200);
});

friendshipApp.delete("/friends/delete", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { friendId } = await c.req.json();
  if (!friendId) return c.json("Need to send have a friendId", 400);

  const friendships = await displayAllFriends(validatedUser.user.id);
  const friendship = friendships.find((f) => f.userId === friendId);

  if (!friendship) return c.json("Friendship not found", 404);

  await removeFriendship(validatedUser.user.id, friendship!.userId);

  const removalMessage = `Removed ${friendship.nickname} as a friend`;
  return c.json(removalMessage, 200);
});

export default friendshipApp;
