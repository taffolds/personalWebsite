import {
  sendGameRequest,
  acceptGameRequest,
  forfeitGame,
  showAllGameRequests,
  getUserGames,
  playMove,
} from "../../services/gameService.js";
import { createTestUser, createTestFriendship } from "../helper.js";
import { describe, it, expect } from "vitest";

describe("Send game requests", () => {
  it("should send a game request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();
    expect(gameRequest!.userId1).toBe(sender.id);
    expect(gameRequest!.userId2).toBe(receiver.id);
  });

  it("should prevent duplicate game requests", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const doubleRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(doubleRequest).toBeNull();
  });
  it("should prevent game requests when there is active game", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    await acceptGameRequest(gameRequest!.id, sender.id);

    const duplicateRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(duplicateRequest).toBeNull();
  });
  it("should allow new games when old games have ended", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const oldRequest = await sendGameRequest(sender.id, receiver.id, sender.id);

    expect(oldRequest).not.toBeNull();

    const game = await acceptGameRequest(oldRequest!.id, receiver.id);
    expect(game).not.toBeNull();

    const ff = await forfeitGame(sender.id, game!.id);
    expect(ff).toBe(true);

    // Thank you to this
    // https://stackoverflow.com/questions/32615713/tobetrue-vs-tobetruthy-vs-tobetrue

    const newRequest = await sendGameRequest(sender.id, receiver.id, sender.id);

    expect(newRequest).not.toBeNull();
  });
});

describe("Accept game requests", () => {
  it("should accept game request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const startedGame = await acceptGameRequest(gameRequest!.id, receiver.id);
    expect(startedGame!.playerOneId).toBe(sender.id);
    expect(startedGame!.playerTwoId).toBe(receiver.id);
  });

  it("should not let users accept their own request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await createTestFriendship(sender.id, receiver.id);

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const startedGame = await acceptGameRequest(gameRequest!.id, sender.id);
    expect(startedGame).toBeNull();
  });

  it("should not let intruder accept request", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();

    await createTestFriendship(alice.id, bob.id);

    const gameRequest = await sendGameRequest(alice.id, bob.id, alice.id);

    expect(gameRequest).not.toBeNull();

    const strangerDanger = await acceptGameRequest(gameRequest!.id, eve.id);
    expect(strangerDanger).toBeNull();
  });
});

describe("Show game requests", () => {
  it("should display game requests", async () => {
    const sol = await createTestUser();
    const luna = await createTestUser();
    const celeste = await createTestUser();

    await createTestFriendship(sol.id, luna.id);
    await createTestFriendship(sol.id, celeste.id);

    await sendGameRequest(luna.id, sol.id, sol.id); // top tier readability
    await sendGameRequest(celeste.id, sol.id, celeste.id);

    const requests = await showAllGameRequests(sol.id);

    expect(requests).toHaveLength(2);
    expect(requests[0]!.fromUserId).toBe(luna.id);
    expect(requests[1]!.fromUserId).toBe(celeste.id);
  });
});

describe("Show all user games", () => {
  it("should display user games", async () => {
    const pam = await createTestUser();
    const dwight = await createTestUser();
    const angela = await createTestUser();

    await createTestFriendship(pam.id, dwight.id);
    await createTestFriendship(angela.id, dwight.id);

    const pamGame = await sendGameRequest(pam.id, dwight.id, dwight.id);
    const angelaGame = await sendGameRequest(angela.id, dwight.id, dwight.id);

    await acceptGameRequest(pamGame!.id, dwight.id);
    await acceptGameRequest(angelaGame!.id, dwight.id);

    const dwightGames = await getUserGames(dwight.id);
    expect(dwightGames).toHaveLength(2);
  });
});

describe("Play move", () => {
  it("should play a move", async () => {
    const harry = await createTestUser();
    const gary = await createTestUser();
    await createTestFriendship(harry.id, gary.id);

    const gameRequest = await sendGameRequest(harry.id, gary.id, harry.id);
    const game = await acceptGameRequest(gameRequest!.id, gary.id);

    const playedMove = await playMove(harry.id, game!.id, 0);
    expect(playedMove).not.toBeNull();
    expect(playedMove!.moves[0]!.column).toBe(0);
  });

  it("should return null when column full", async () => {
    const nimrod = await createTestUser();
    const noddy = await createTestUser();
    await createTestFriendship(nimrod.id, noddy.id);

    const gameRequest = await sendGameRequest(noddy.id, nimrod.id, nimrod.id);
    const game = await acceptGameRequest(gameRequest!.id, nimrod.id);

    await playMove(nimrod.id, game!.id, 0);
    await playMove(noddy.id, game!.id, 0);
    await playMove(nimrod.id, game!.id, 0);
    await playMove(noddy.id, game!.id, 0);
    await playMove(nimrod.id, game!.id, 0);
    const lastRowMove = await playMove(noddy.id, game!.id, 0);
    expect(lastRowMove).not.toBeNull(); // checking column-filling move is actually played
    const filledColumnMove = await playMove(nimrod.id, game!.id, 0);

    expect(filledColumnMove).toBeNull();
  });
});

describe("Forfeit game", () => {
  it("should forfeit game", async () => {
    const soreLoser = await createTestUser();
    const happyWinner = await createTestUser();
    await createTestFriendship(soreLoser.id, happyWinner.id);

    const gameRequest = await sendGameRequest(
      soreLoser.id,
      happyWinner.id,
      soreLoser.id,
    );
    const game = await acceptGameRequest(gameRequest!.id, happyWinner.id);
    const forfeitedGame = await forfeitGame(soreLoser.id, game!.id);

    expect(forfeitedGame).toBe(true);
  });
});
