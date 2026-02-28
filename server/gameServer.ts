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
  checkGameExists,
  getGameRequest,
  getSpecificGameRequest,
} from "./services/gameService.js";
import { getFriendship } from "./services/friendshipService.js";

const gameApp = new Hono();

// DO NOT CHANGE UNLESS ALSO CHANGING VALIDATION LOGIC IN FRIENDSHIP_SERVER
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

gameApp.post("/requests/send", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { friendId, firstMove } = await c.req.json();

  if (!friendId)
    return c.json({ message: "Who you sending this game request to?" }, 400);
  if (!firstMove) return c.json({ message: "Need first mover" }, 400);

  if (friendId === validatedUser.user.id)
    return c.json({ message: "Cannot send request to yourself" }, 403);

  const validateFriendship = await getFriendship(
    validatedUser.user.id,
    friendId,
  );
  if (!validateFriendship)
    return c.json({ message: "No active friendship" }, 403);

  const existingRequest = await getGameRequest(validatedUser.user.id, friendId);
  if (existingRequest)
    return c.json({ message: "Game request already exists" }, 409);

  const existingGame = await checkGameExists(validatedUser.user.id, friendId);
  if (existingGame)
    return c.json({ message: "Active game already exists" }, 409);

  const gameRequest = await sendGameRequest(
    validatedUser!.user!.id,
    friendId,
    firstMove,
  );

  if (!gameRequest) return c.json({ message: "Failed to create game" }, 500);

  return c.json({ requestId: gameRequest.id }, 201);
});

gameApp.post("/requests/accept", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );

  const { requestId } = await c.req.json();

  if (!requestId) return c.json({ message: "Which game?" }, 400);

  const validateRequestExist = await getSpecificGameRequest(requestId);
  if (
    validateRequestExist!.userId1 !== validatedUser.user.id &&
    validateRequestExist!.userId2 !== validatedUser.user.id
  ) {
    return c.json({ message: "Not your game request" }, 403);
  }

  if (validateRequestExist!.requestedBy === validatedUser.user.id) {
    return c.json({ message: "Can't accept your own requests" }, 403);
  }

  const startedGame = await acceptGameRequest(requestId, validatedUser.user.id);
  if (!startedGame) return c.json({ message: "Error creating game" }, 400); // Check this status code, server side error

  return c.json(startedGame, 201);
});

gameApp.get("/requests/incoming", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const requests = await showAllGameRequests(validatedUser.user.id);
  return c.json(requests, 200);
});

gameApp.get("/user", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const userGames = await getUserGames(validatedUser.user.id);
  return c.json(userGames, 200);
});

gameApp.get("/game/:gameId", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);
  const game = await getCurrentGame(gameId);
  if (!game) return c.json({ message: "Couldn't find game" }, 404);
  if (
    game.playerOneId !== validatedUser.user.id &&
    game.playerTwoId !== validatedUser.user.id
  ) {
    return c.json({ message: "Trying to access someone else's game" }, 403);
  }

  return c.json(game);
});

gameApp.post("/game/:gameId/move", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);

  const { move } = await c.req.json();

  const game = await getCurrentGame(gameId);
  if (!game) return c.json({ message: "Couldn't find game" }, 404);
  if (game.status !== "in_progress")
    return c.json({ message: "Game not active" }, 409);
  if (
    game.playerOneId !== validatedUser.user.id &&
    game.playerTwoId !== validatedUser.user.id
  ) {
    return c.json({ message: "Not your game" }, 403);
  }

  const validateTurn = checkTurn(
    validatedUser.user.id,
    game.moves.length,
    game.firstMove,
  );
  if (!validateTurn) return c.json({ message: "Not your turn" }, 403);

  await playMove(validatedUser.user.id, gameId, move);

  return c.json({ message: "Move made" }, 201);
});

gameApp.patch("/game/:gameId/forfeit", async (c) => {
  const validatedUser = await validateUserDetails(c);
  if ("message" in validatedUser)
    return c.json(
      { message: validatedUser.message },
      validatedUser.status as any,
    );
  const gameIdAsString = c.req.param("gameId");
  const gameId: number = Number(gameIdAsString);

  const game = await getCurrentGame(gameId);
  if (!game) return c.json({ message: "Couldn't find game" }, 404);
  if (game.status !== "in_progress")
    return c.json({ message: "Game already ended" }, 409);
  if (
    game.playerOneId !== validatedUser.user.id &&
    game.playerTwoId !== validatedUser.user.id
  ) {
    return c.json({ message: "Not your game" }, 403);
  }

  const forfeitedGame = await forfeitGame(validatedUser.user.id, gameId);
  if (!forfeitedGame) return c.json({ message: "Couldn't forfeit game" }, 404);

  return c.json({ message: "Game forfeited" }, 200);
});

export default gameApp;
