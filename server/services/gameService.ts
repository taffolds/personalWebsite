import { db } from "../db/index.js";
import { users, games, gameRequests } from "../db/schema.js";
import { eq, and, ne, or, sql } from "drizzle-orm";
import { checkWinner } from "../utils/winValidation.js";
import {
  reconstructBoard,
  isColumnFull,
  applyMove,
} from "../utils/boardHelper.js";

export async function sendGameRequest(
  requestedBy: number,
  sentTo: number,
  firstMove: number,
) {
  const ids = [requestedBy, sentTo].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number;

  const existingGameRequest = await db
    .select()
    .from(gameRequests)
    .where(and(eq(gameRequests.userId1, id1), eq(gameRequests.userId2, id2)));

  if (existingGameRequest.length > 0) {
    // console.warn("Can't send game request - already exists");
    return null;
  }

  const createdRequest = await db
    .insert(gameRequests)
    .values({
      userId1: id1,
      userId2: id2,
      firstMove: firstMove,
      requestedBy: requestedBy,
      expiresAt: new Date(), // +3 days
      createdAt: new Date(),
    })
    .returning();

  return createdRequest[0] ?? null;
}

export async function acceptGameRequest(requestId: number, userId: number) {
  const [request] = await db
    .select()
    .from(gameRequests)
    .where(eq(gameRequests.id, requestId));

  if (!request) return null;

  const isReceiver =
    (request.userId1 === userId || request.userId2 === userId) &&
    request.requestedBy !== userId;

  if (!isReceiver) return null;

  const res = await db.transaction(async (tx) => {
    const newGame = await tx
      .insert(games)
      .values({
        playerOneId: request.userId1,
        playerTwoId: request.userId2,
        firstMove: request.firstMove,
        status: "in_progress",
        createdAt: new Date(),
      })
      .returning();

    await tx.delete(gameRequests).where(eq(gameRequests.id, requestId));

    return newGame[0] ?? null;
  });

  return res;
}

export async function showAllGameRequests(userId: number) {
  const fromUserId = sql<number>`CASE WHEN ${gameRequests.userId1} = ${userId} THEN ${gameRequests.userId2} ELSE ${gameRequests.userId1} END`;

  const requests = await db
    .select({
      requestId: gameRequests.id,
      fromUserId: fromUserId,
      fromNickname: users.nickname,
    })
    .from(gameRequests)
    .innerJoin(users, eq(fromUserId, users.id))
    .where(
      and(
        or(eq(gameRequests.userId1, userId), eq(gameRequests.userId2, userId)),
        ne(gameRequests.requestedBy, userId),
      ),
    );
  return requests;
}

export async function getUserGames(userId: number) {
  const userGames = await db
    .select()
    .from(games)
    .where(
      and(
        or(eq(games.playerOneId, userId), eq(games.playerTwoId, userId)),
        eq(games.status, "in_progress"),
      ),
    );
  return userGames;
}

export async function validateUserGame(userId: number, gameId: number) {
  const game = await db
    .select()
    .from(games)
    .where(
      and(
        or(eq(games.playerOneId, userId), eq(games.playerTwoId, userId)),
        eq(games.id, gameId),
      ),
    );
  return game;
}

export async function getCurrentGame(gameId: number) {
  const game = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) return null;
  return game[0];
}

export async function checkActiveGame(gameId: number) {
  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, gameId), eq(games.status, "in_progress")));
  if (!game) return false;
  return true;
}

export async function checkTurn(playerId: number, gameId: number) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));

  if (!game) return null;

  const turnNumber = game.moves.length;
  const firstMover = game.firstMove;

  if (turnNumber % 2 === 0) {
    if (firstMover === playerId) {
      return true;
    } else {
      return false;
    }
  } else {
    if (firstMover === playerId) {
      return false;
    } else {
      return true;
    }
  }
}

export async function playMove(
  playerId: number,
  gameId: number,
  moveColumn: number,
) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) return null;

  if (game.status !== "in_progress") {
    return null;
  }

  const board = reconstructBoard(
    game.moves,
    game.playerOneId,
    game.playerTwoId,
    game.firstMove,
  );

  if (isColumnFull(board, moveColumn)) {
    return null;
  }

  const updatedBoard = applyMove(board, moveColumn, playerId);
  const winner = checkWinner(updatedBoard!);

  const newMove = {
    moveNumber: game.moves.length + 1,
    column: moveColumn,
    timestamp: new Date().toISOString(),
  };

  if (winner === "draw") {
    const saveDraw = await db
      .update(games)
      .set({
        status: "draw",
        moves: [...game.moves, newMove],
        lastMoveAt: new Date(),
      })
      .where(eq(games.id, gameId))
      .returning();

    return saveDraw[0];
  }

  if (winner !== null && !isNaN(winner)) {
    // Duct tape
    const saveWinner = await db
      .update(games)
      .set({
        winnerId: winner,
        moves: [...game.moves, newMove],
        status: "completed",
        lastMoveAt: new Date(),
      })
      .where(eq(games.id, gameId))
      .returning();

    return saveWinner[0];
  }
  const updated = await db
    .update(games)
    .set({
      moves: [...game.moves, newMove],
      lastMoveAt: new Date(),
    })
    .where(eq(games.id, gameId))
    .returning();

  return updated[0];
}

export async function forfeitGame(userId: number, gameId: number) {
  const winnerId = sql<number>`CASE WHEN ${games.playerOneId} = ${userId} THEN ${games.playerTwoId} ELSE ${games.playerOneId} END`;

  const updatedGame = await db
    .update(games)
    .set({
      winnerId: winnerId,
      status: "forfeited",
    })
    .where(eq(games.id, gameId));

  if (!updatedGame) return false;
  return true;
}
