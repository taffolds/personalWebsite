import { Hono } from "hono";
import { getUserById } from "./services/userService.js";
import { getSignedCookie } from "hono/cookie";
import {
  playMove,
  checkTurn,
  sendGameRequest,
  acceptGameRequest,
  showAllGameRequests,
  getUserGames,
  getCurrentGame,
  forfeitGame,
  validateUserGame,
  checkActiveGame,
  checkGameExists,
  getGameRequest,
} from "./services/gameService.js";
import { getFriendship } from "./services/friendshipService.js";

const gameApp = new Hono();

// DO NOT CHANGE UNLESS ALSO CHANGING VALIDATION LOGIC IN FRIENDSHIP_SERVER
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

gameApp.post("/requests/send", async (c) => {
  // Validate friendship
  // Validate no active requests
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { friendId, firstMove } = await c.req.json();

  if (!friendId) return c.json("Who you sending this game request to?", 400);
  if (!firstMove) return c.json("Need first mover", 400);

  if (friendId === validatedUser.user.id)
    return c.json("Cannot send request to yourself", 403);

  const validateFriendship = await getFriendship(
    validatedUser.user.id,
    friendId,
  );
  if (!validateFriendship) return c.json("No active friendship", 403);

  const existingRequest = await getGameRequest(validatedUser.user.id, friendId);
  if (existingRequest) return c.json("Game request already exists", 409);

  const existingGame = await checkGameExists(validatedUser.user.id, friendId);
  if (existingGame) return c.json("Active game already exists", 409);

  const gameRequest = await sendGameRequest(
    validatedUser!.user!.id,
    friendId,
    firstMove,
  );

  if (!gameRequest) return c.json("Failed to create game", 500);

  return c.json({ requestId: gameRequest.id }, 201);
});

gameApp.post("/requests/accept", async (c) => {
  // Validate request exists
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);

  const { requestId } = await c.req.json();

  if (!requestId) return c.json("Which game?", 400);
  /*
    const requests = await showAllGameRequests(validatedUser.user.id);
    const request = requests.find((r) => r.requestId === requests);

    if(!request) return c.json("Couldn't find game", 400);
*/
  const startedGame = await acceptGameRequest(requestId, validatedUser.user.id);
  if (!startedGame) return c.json("Error creating game", 400); // Check this status code, server side error

  return c.json(startedGame, 201);
});

gameApp.get("/requests/incoming", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const requests = await showAllGameRequests(validatedUser.user.id);
  return c.json(requests, 200);
});

gameApp.get("/user", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const userGames = await getUserGames(validatedUser.user.id);
  return c.json(userGames, 200);
});

gameApp.get("/game/:gameId", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);
  const validateGame = await validateUserGame(validatedUser.user.id, gameId);
  if (!validateGame) return c.json("Trying to access someone else's game", 403);
  const game = await getCurrentGame(gameId);
  if (!game) return c.json("Couldn't find game", 404);

  return c.json(game);
});

gameApp.post("/game/:gameId/move", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);

  const { move } = await c.req.json();

  const validateActiveGame = await checkActiveGame(gameId);
  if (!validateActiveGame) return c.json("Game not active", 409);

  const validateTurn = await checkTurn(validatedUser.user.id, gameId);
  if (!validateTurn) return c.json({ error: "Not your turn" }, 403);

  await playMove(validatedUser.user.id, gameId, move);

  return c.json({ message: "Move made" }, 201);
});

gameApp.patch("/game/:gameId/forfeit", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("error" in validatedUser)
    return c.json(validatedUser.error, validatedUser.status as any);
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);

  const forfeitedGame = await forfeitGame(validatedUser.user.id, gameId);
  if (!forfeitedGame)
    return c.json({ error: "Couldn't forfeit game", status: 404 });

  return c.json({ message: "Game forfeited" }, 200);
});

export default gameApp;
