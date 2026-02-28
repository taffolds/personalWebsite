import { Hono } from "hono";
import { getUserById } from "./services/userService.js";
import { getSignedCookie } from "hono/cookie";
import {
  getFriendship,
  confirmFriendship,
  displayAllFriends,
  removeFriendRequest,
  removeFriendship,
  searchForUsers,
  sendFriendRequest,
  showAllFriendRequests,
  showPendingRequests,
  getFriendRequest,
} from "./services/friendshipService.js";

const friendshipApp = new Hono();

// DO NOT CHANGE UNLESS ALSO CHANGING VALIDATION LOGIC IN GAME_SERVER
const cookieSecret = process.env.COOKIE_SECRET!;

if (!cookieSecret) {
  throw new Error("No Cookie Secret");
}

type ValidationResult =
  | { message: string; status: number } // is the "as any" fix alright? I always send a status
  | { user: { id: number; nickname: string | null } };

async function validateUserDetails(c: any): Promise<ValidationResult> {
  const userIdAsString = await getSignedCookie(c, cookieSecret, "user_id");
  if (!userIdAsString) return { message: "Not authenticated", status: 401 };

  const userId = Number(userIdAsString);
  const user = await getUserById(userId);

  if (!user) return { message: "User not found", status: 404 };

  if (!user.nickname)
    return {
      message: "Need to set a nickname to access resource",
      status: 403,
    };

  return { user };
}

friendshipApp.get("/search", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser && "status" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const searchNickname = c.req.query("query");
  if (!searchNickname)
    return c.json({ message: "Search field has to contain something" }, 400);
  const res = await searchForUsers(searchNickname);

  return c.json(res, 200);
});

friendshipApp.post("/requests/send", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { friendId } = await c.req.json();

  if (!friendId) return c.json({ message: "Need user id" }, 400);

  const destinationFriend = await getUserById(friendId);
  if (!destinationFriend) return c.json({ message: "User not found" }, 404);

  if (destinationFriend.id === validatedUser.user.id) {
    return c.json({ message: "Cannot send request to yourself" }, 400);
  }

  const existingRequest = await getFriendRequest(
    validatedUser.user.id,
    destinationFriend.id,
  );
  if (existingRequest)
    return c.json({ message: "Friend request already exists" }, 409);

  const existingFriendship = await getFriendship(
    validatedUser.user.id,
    destinationFriend.id,
  );
  if (existingFriendship) return c.json({ message: "Already friends" }, 409);

  const sentRequest = await sendFriendRequest(
    validatedUser!.user!.id,
    destinationFriend.id,
  );

  if (!sentRequest) return c.json({ message: "Failed to send request" }, 500);

  return c.json({ message: "Friend request sent" }, 201);
});

friendshipApp.get("/requests/outgoing", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const outgoingRequests = await showPendingRequests(validatedUser.user.id);
  return c.json({ outgoingRequests: outgoingRequests }, 200);
});

friendshipApp.get("/requests/incoming", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const requests = await showAllFriendRequests(validatedUser.user.id);
  return c.json(requests, 200);
});

friendshipApp.post("/requests/accept", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { requestId } = await c.req.json();
  if (!requestId)
    return c.json({ message: "Need to send have a requestId" }, 400);

  const requests = await showAllFriendRequests(validatedUser.user.id);
  const request = requests.find((r) => r.requestId === requestId);

  if (!request) return c.json("Must have request to be friends", 404);
  const friendship = await confirmFriendship(
    request.requestId,
    validatedUser.user.id,
  );

  if (!friendship)
    return c.json({ message: "Must have request to be friends" }, 404);

  return c.json({ message: "Friendship Created" }, 201);
});

friendshipApp.delete("/requests/delete", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { requestId } = await c.req.json();
  if (!requestId)
    return c.json({ message: "Need to send have a requestId" }, 400);

  const removed = await removeFriendRequest(requestId, validatedUser.user.id);
  if (!removed) return c.json({ message: "Not your request to delete" }, 401);
  return c.json({ message: "Request deleted" }, 200);
});

friendshipApp.get("/friends", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const friends = await displayAllFriends(validatedUser.user.id);
  return c.json(friends, 200);
});

friendshipApp.delete("/friends/delete", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { friendId } = await c.req.json();
  if (!friendId)
    return c.json({ message: "Need to send have a friendId" }, 400);

  const friendship = await getFriendship(validatedUser.user.id, friendId);

  if (!friendship) return c.json({ message: "Friendship not found" }, 404);

  await removeFriendship(friendship.userId1, friendship.userId2);

  return c.json({ message: "Friendship removed" }, 200);
});

export default friendshipApp;
