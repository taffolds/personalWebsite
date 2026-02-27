import { describe, it, expect, vi, afterEach } from "vitest";

import {
  createTestUser,
  createTestFriendship,
  setNicknameTestUser,
  createTestGame,
} from "./helper.js";
import { getSignedCookie } from "hono/cookie";

vi.mock("hono/cookie", async () => {
  const actual = await vi.importActual("hono/cookie");
  return {
    ...actual,
    getSignedCookie: vi.fn(),
  };
});

import gameApp from "../gameServer.js";

describe("Send game request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should send game request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "dorothy");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(res.status).toBe(201);
  });
  it("should only allow one active game request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "constantine");
    await setNicknameTestUser(user2.id, "vincent");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const firstReq = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(firstReq.status).toBe(201);

    const duplicateReq = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(duplicateReq.status).toBe(409);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const friendReqBack = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user1.id,
        firstMove: user1.id,
      }),
    });

    expect(friendReqBack.status).toBe(409);
  });
  it("should not allow sending request when active game exists", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "barry");
    await setNicknameTestUser(user2.id, "harold");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(201);

    const duplicateRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user1.id,
        firstMove: user1.id,
      }),
    });

    expect(duplicateRequest.status).toBe(409);
  });
  it("should require friendship for game request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "mrWhatsIt");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(res.status).toBe(403);
  });
  it("should require being logged in", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user.id,
        firstMove: user.id,
      }),
    });

    expect(res.status).toBe(401);
  });
  it("requires a destination friend for the request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "beth");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it("should stop you from sending yourself a request", async () => {
    const user1 = await createTestUser();
    await setNicknameTestUser(user1.id, "agatha");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user1.id,
        firstMove: user1.id,
      }),
    });
    expect(res.status).toBe(403);
  });

  it("should allow you to send a request, and be playerTwo", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "timothy");
    await setNicknameTestUser(user2.id, "jessica");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user2.id,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    const requestId = data.requestId;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(201);
    const newGame = await acceptRequest.json();
    const gameId = newGame.id;

    const getGameForCheck = await gameApp.request(`/game/${gameId}`);
    expect(getGameForCheck.status).toBe(200);

    const gameData = await getGameForCheck.json();
    expect(gameData.firstMove).toBe(user2.id);
  });
});

describe("Accept game request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should accept game request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "matthew");
    await setNicknameTestUser(user2.id, "mathilda");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(201);
  });
  it("should not accept requests belonging to others", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    await setNicknameTestUser(user1.id, "bubbles");
    await setNicknameTestUser(user3.id, "blossom");

    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user3.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(403);
  });
  it("stops you from accepting requests that you've sent", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "emma");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(403);
  });
});

describe("Incoming game requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should display incoming game requests", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "hedda");
    await setNicknameTestUser(user2.id, "wilma");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentReq = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user2.id, // intentional to test two in one
      }),
    });

    expect(sentReq.status).toBe(201);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const res = await gameApp.request("/requests/incoming");

    expect(res.status).toBe(200);

    const incoming = await res.json();
    expect(incoming).toHaveLength(1);
    //expect(incoming[0].requestId).toBe(outgoing[0].requestId);
    //expect(incoming[0].firstMover).toBe(outgoing[0].firstMove);
    expect(incoming[0].fromNickname).toBe("hedda");
    expect(incoming[0].fromUserId).toBe(user1.id);
  });
  it("should require validation", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "dumbo");

    const res = await gameApp.request("/requests/incoming");

    expect(res.status).toBe(404);
  });
  it("should return 200 OK if no requests", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "trevor");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request("/requests/incoming");
    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data).toHaveLength(0);
  });
});

describe("Current game", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should get current game", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "matthew");
    await setNicknameTestUser(user2.id, "mathilda");
    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(201);

    const requestGameInfo = await acceptRequest.json();
    const reqGameId = requestGameInfo.id;

    const game = await gameApp.request(`/game/${reqGameId}`);
    expect(game.status).toBe(200);

    const gameData = await game.json();
    // expect(gameData.firstMove).toBe(user1.id);
    expect(gameData.status).toBe("in_progress");
    expect(gameData.playerOneId).toBe(user1.id);
    expect(gameData.playerTwoId).toBe(user2.id);
  });
  it("should deny access to strangers games", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    await setNicknameTestUser(user1.id, "elaine");
    await setNicknameTestUser(user2.id, "irene");
    await setNicknameTestUser(user3.id, "benny");

    await createTestFriendship(user1.id, user2.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const sentRequest = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: user2.id,
        firstMove: user1.id,
      }),
    });

    expect(sentRequest.status).toBe(201);

    const { requestId } = await sentRequest.json();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const acceptRequest = await gameApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(acceptRequest.status).toBe(201);

    const requestGameInfo = await acceptRequest.json();
    const reqGameId = requestGameInfo.id;

    const game = await gameApp.request(`/game/${reqGameId}`);
    expect(game.status).toBe(200);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user3.id));

    const res = await gameApp.request(`/game/${reqGameId}`);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toContain("Trying to access someone else's game");
  });
  it("should return error if game doesn't exist", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "jordan");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request("/game/1234567890");
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toContain("Couldn't find game");
  });
});

describe("Make move", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should make a move", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "zoe");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request(`/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(res.status).toBe(201);
  });
  it("should prevent move when not your turn", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "felix");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request(`/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(res.status).toBe(201);

    const duplicateMove = await gameApp.request(`/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(duplicateMove.status).toBe(403);
    const dupMovData = await duplicateMove.json();
    expect(dupMovData.error).toContain("Not your turn");
  });
  it("should not allow strangers to make move", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    await setNicknameTestUser(user1.id, "lana");
    await setNicknameTestUser(user3.id, "billie");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user3.id));

    const res = await gameApp.request(`/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Not your game");
  });
  it("should stop you from making move in inactive game", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "damian");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request(`/game/${gameId}/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(200);

    const illegalMove = await gameApp.request(`/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(illegalMove.status).toBe(409);
  });
});

describe("Forfeit game", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should forfeit game", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "peggy");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request(`/game/${gameId}/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(200);
  });
  it("should prevent forfeiting inactive game", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "zack");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user1.id));

    const res = await gameApp.request(`/game/${gameId}/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(200);

    const doubleForfeit = await gameApp.request(`/game/${gameId}/forfeit`, {
      method: "PATCH",
    });

    expect(doubleForfeit.status).toBe(409);
  });
  it("should only allow forfeiting own games", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    await setNicknameTestUser(user1.id, "jodie");
    await setNicknameTestUser(user3.id, "poppy");
    await createTestFriendship(user1.id, user2.id);
    const game = await createTestGame(user1.id, user2.id, user1.id);
    const gameId = game.id;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user3.id));

    const res = await gameApp.request(`/game/${gameId}/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(403);
  });
  it("should return error if game isn't found", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "zack");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request(`/game/1234567890/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(404);
  });
});
