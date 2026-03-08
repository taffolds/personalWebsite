import {
  sendGameRequest,
  acceptGameRequest,
  forfeitGame,
  showIncomingGameRequests,
  getUserGames,
  playMove,
  removeGameRequest,
  showOutgoingGameRequests,
  getGameRequest,
  getSpecificGameRequest,
  checkGameExists,
  getHistoricGames,
  getCurrentGame,
  getGameStatus,
} from "../../services/gameService.js";
import {
  createTestUser,
  createTestFriendship,
  setNicknameTestUser,
} from "../helper.js";
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

describe("Get game request", () => {
  it("should return game request when it exists", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await sendGameRequest(sender.id, receiver.id, sender.id);

    const request = await getGameRequest(sender.id, receiver.id);

    expect(request).not.toBeNull();
    expect(request!.userId1).toBe(sender.id);
    expect(request!.userId2).toBe(receiver.id);
  });
});

describe("Get game request by id", () => {
  it("should return request when exists", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const sentRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    const request = await getSpecificGameRequest(sentRequest!.id);

    expect(request).not.toBeNull();
    expect(request!.id).toBe(sentRequest!.id);
    expect(request!.userId1).toBe(sender.id);
    expect(request!.userId2).toBe(receiver.id);
  });
});

describe("Check game exists", () => {
  it("should return true when active game is found", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const request = await sendGameRequest(sender.id, receiver.id, sender.id);
    await acceptGameRequest(request!.id, receiver.id);

    const exists = await checkGameExists(sender.id, receiver.id);
    expect(exists).toBe(true);
  });

  it("should return false when no active game", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const request = await sendGameRequest(sender.id, receiver.id, sender.id);
    const game = await acceptGameRequest(request!.id, receiver.id);

    await forfeitGame(sender.id, game!.id);

    const exists = await checkGameExists(sender.id, receiver.id);
    expect(exists).toBe(false);
  });
});

describe("Remove game requests", () => {
  it("should remove game request when user is sender", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const removed = await removeGameRequest(gameRequest!.id, sender.id);
    expect(removed).toBe(true);
  });

  it("should remove game request when user is receiver", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const removed = await removeGameRequest(gameRequest!.id, receiver.id);
    expect(removed).toBe(true);
  });

  it("should stop eve from removing user's request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    const eve = await createTestUser();

    const gameRequest = await sendGameRequest(
      sender.id,
      receiver.id,
      sender.id,
    );

    expect(gameRequest).not.toBeNull();

    const removed = await removeGameRequest(gameRequest!.id, eve.id);
    expect(removed).toBe(false);
  });

  it("should return false when request does not exist", async () => {
    const user = await createTestUser();

    const removed = await removeGameRequest(4546341, user.id);
    expect(removed).toBe(false);
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

describe("Show incoming game requests", () => {
  it("should display incoming game requests", async () => {
    const sol = await createTestUser();
    const luna = await createTestUser();
    const celeste = await createTestUser();

    await createTestFriendship(sol.id, luna.id);
    await createTestFriendship(sol.id, celeste.id);

    await sendGameRequest(luna.id, sol.id, sol.id); // top tier readability
    await sendGameRequest(celeste.id, sol.id, celeste.id);

    const requests = await showIncomingGameRequests(sol.id);

    expect(requests).toHaveLength(2);
    expect(requests[0]!.friendId).toBe(luna.id);
    expect(requests[1]!.friendId).toBe(celeste.id);
  });
});

describe("Show outgoing game requests", () => {
  it("should display outgoing game requests", async () => {
    const sender = await createTestUser();
    const receiver1 = await createTestUser();
    const receiver2 = await createTestUser();

    await sendGameRequest(sender.id, receiver1.id, sender.id);
    await sendGameRequest(sender.id, receiver2.id, sender.id);

    const requests = await showOutgoingGameRequests(sender.id);

    expect(requests).toHaveLength(2);
    expect(requests[0]!.friendId).toBe(receiver1.id);
    expect(requests[1]!.friendId).toBe(receiver2.id);
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

describe("Get historic games", () => {
  it("should display historic games", async () => {
    const bam = await createTestUser();
    const johnny = await createTestUser();
    const chris = await createTestUser();

    const request1 = await sendGameRequest(bam.id, johnny.id, bam.id);
    const request2 = await sendGameRequest(bam.id, chris.id, bam.id);

    const game1 = await acceptGameRequest(request1!.id, johnny.id);
    const game2 = await acceptGameRequest(request2!.id, chris.id);

    await playMove(bam.id, game1!.id, 0);
    await playMove(bam.id, game2!.id, 0);

    await forfeitGame(johnny.id, game1!.id);
    await forfeitGame(chris.id, game2!.id);

    const historicGames = await getHistoricGames(bam.id);
    expect(historicGames).toHaveLength(2);
    expect(historicGames[0]!.opponentId).toBe(chris.id); // Newest game displayed first
    expect(historicGames[1]!.opponentId).toBe(johnny.id);
  });

  it("should not display active games in historic games", async () => {
    const ham = await createTestUser();
    const chicken = await createTestUser();
    const tofu = await createTestUser();

    const request1 = await sendGameRequest(ham.id, chicken.id, ham.id);
    const request2 = await sendGameRequest(ham.id, tofu.id, ham.id);

    const game = await acceptGameRequest(request1!.id, chicken.id);
    await acceptGameRequest(request2!.id, tofu.id);

    await forfeitGame(chicken.id, game!.id);

    const historicGames = await getHistoricGames(ham.id);
    expect(historicGames).toHaveLength(1);
    expect(historicGames[0]!.opponentId).toBe(chicken.id);
  });
});

describe("Should get current game", () => {
  it("should show opponent nickname", async () => {
    const playerOne = await createTestUser();
    const playerTwo = await createTestUser();
    await setNicknameTestUser(playerTwo.id, "barbara");

    const request = await sendGameRequest(
      playerOne.id,
      playerTwo.id,
      playerOne.id,
    );
    const game = await acceptGameRequest(request!.id, playerTwo.id);

    const currentGame = await getCurrentGame(game!.id, playerOne.id);
    expect(currentGame!.opponentId).toBe(playerTwo.id);
    expect(currentGame!.opponentNickname).toBe("barbara");
  });

  it("should display users in correct columns", async () => {
    const meFirst = await createTestUser();
    const okayThen = await createTestUser();

    const request = await sendGameRequest(okayThen.id, meFirst.id, meFirst.id);
    const game = await acceptGameRequest(request!.id, meFirst.id);

    const currentGame = await getCurrentGame(game!.id, okayThen.id);
    expect(currentGame!.opponentId).toBe(meFirst.id);
  });
});

describe("Get game status", () => {
  it("should display status as in progress", async () => {
    const playerOne = await createTestUser();
    const playerTwo = await createTestUser();

    const request = await sendGameRequest(
      playerOne.id,
      playerTwo.id,
      playerOne.id,
    );
    const game = await acceptGameRequest(request!.id, playerTwo.id);

    const gameStatus = await getGameStatus(game!.id);
    expect(gameStatus!.status).toBe("in_progress");
  });

  it("should display status as forfeited", async () => {
    const playerOne = await createTestUser();
    const playerTwo = await createTestUser();

    const request = await sendGameRequest(
      playerOne.id,
      playerTwo.id,
      playerOne.id,
    );
    const game = await acceptGameRequest(request!.id, playerTwo.id);

    const oldStatus = await getGameStatus(game!.id);
    expect(oldStatus!.status).toBe("in_progress");

    await forfeitGame(playerOne.id, game!.id);
    const newStatus = await getGameStatus(game!.id);
    expect(newStatus!.status).toBe("forfeited");
  });

  it("should display game as completed", async () => {
    const playerOne = await createTestUser();
    const playerTwo = await createTestUser();

    const request = await sendGameRequest(
      playerOne.id,
      playerTwo.id,
      playerOne.id,
    );
    const game = await acceptGameRequest(request!.id, playerTwo.id);

    const oldStatus = await getGameStatus(game!.id);
    expect(oldStatus!.status).toBe("in_progress");

    await playMove(playerOne.id, game!.id, 1);
    await playMove(playerTwo.id, game!.id, 1);
    await playMove(playerOne.id, game!.id, 2);
    await playMove(playerTwo.id, game!.id, 2);
    await playMove(playerOne.id, game!.id, 3);
    await playMove(playerTwo.id, game!.id, 3);
    await playMove(playerOne.id, game!.id, 4);

    const newStatus = await getGameStatus(game!.id);
    expect(newStatus!.status).toBe("completed");
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

describe("Draw condition", () => {
  it("should mark game as drawn", async () => {
    const playerOne = await createTestUser();
    const playerTwo = await createTestUser();

    const request = await sendGameRequest(
      playerOne.id,
      playerTwo.id,
      playerOne.id,
    );
    const game = await acceptGameRequest(request!.id, playerTwo.id);

    const oldStatus = await getGameStatus(game!.id);
    expect(oldStatus!.status).toBe("in_progress");

    await playMove(playerOne.id, game!.id, 0);
    await playMove(playerTwo.id, game!.id, 1);
    await playMove(playerOne.id, game!.id, 0);
    await playMove(playerTwo.id, game!.id, 1);
    await playMove(playerOne.id, game!.id, 0);
    await playMove(playerTwo.id, game!.id, 1);

    await playMove(playerOne.id, game!.id, 1);
    await playMove(playerTwo.id, game!.id, 0);
    await playMove(playerOne.id, game!.id, 1);
    await playMove(playerTwo.id, game!.id, 0);
    await playMove(playerOne.id, game!.id, 1);
    await playMove(playerTwo.id, game!.id, 0);

    await playMove(playerOne.id, game!.id, 2);
    await playMove(playerTwo.id, game!.id, 3);
    await playMove(playerOne.id, game!.id, 2);
    await playMove(playerTwo.id, game!.id, 3);
    await playMove(playerOne.id, game!.id, 2);
    await playMove(playerTwo.id, game!.id, 3);

    await playMove(playerOne.id, game!.id, 3);
    await playMove(playerTwo.id, game!.id, 2);
    await playMove(playerOne.id, game!.id, 3);
    await playMove(playerTwo.id, game!.id, 2);
    await playMove(playerOne.id, game!.id, 3);
    await playMove(playerTwo.id, game!.id, 2);

    await playMove(playerOne.id, game!.id, 4);
    await playMove(playerTwo.id, game!.id, 5);
    await playMove(playerOne.id, game!.id, 4);
    await playMove(playerTwo.id, game!.id, 5);
    await playMove(playerOne.id, game!.id, 4);
    await playMove(playerTwo.id, game!.id, 5);

    await playMove(playerOne.id, game!.id, 5);
    await playMove(playerTwo.id, game!.id, 4);
    await playMove(playerOne.id, game!.id, 5);
    await playMove(playerTwo.id, game!.id, 4);
    await playMove(playerOne.id, game!.id, 5);
    await playMove(playerTwo.id, game!.id, 4);

    await playMove(playerOne.id, game!.id, 6);
    await playMove(playerTwo.id, game!.id, 6);
    await playMove(playerOne.id, game!.id, 6);
    await playMove(playerTwo.id, game!.id, 6);
    await playMove(playerOne.id, game!.id, 6);
    await playMove(playerTwo.id, game!.id, 6);

    const drawGame = await getHistoricGames(playerOne.id);
    expect(drawGame[0]!.status).toBe("draw");

    expect(drawGame[0]!.winnerId).toBeNull();
  });
});
