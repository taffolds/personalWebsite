import { describe, it, expect, vi, afterEach } from "vitest";

import {
  createTestUser,
  createTestFriendship,
  setNicknameTestUser,
  createTestGame,
  alterTestGame,
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
    const frbData = await friendReqBack.json();
    expect(frbData.message).toBe("Game request already exists");
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
    const drData = await duplicateRequest.json();
    expect(drData.message).toBe("Active game already exists");
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
    const data = await res.json();
    expect(data.message).toBe("No active friendship");
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
    const data = await res.json();
    expect(data.message).toBe("Not authenticated");
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
    const data = await res.json();
    expect(data.message).toBe("Cannot send request to yourself");
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

describe("Remove game request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should remove game request", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await createTestFriendship(user1.id, user2.id);
    await setNicknameTestUser(user1.id, "popeye");

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
    const createdData = await res.json();
    const requestId = createdData.requestId;

    const deletedRequest = await gameApp.request("/requests/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(deletedRequest.status).toBe(200);
    const data = await deletedRequest.json();
    expect(data.message).toBe("Request removed");
  });

  it("should require request id", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "olive");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const emptyBody = await gameApp.request("/requests/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(emptyBody.status).toBe(400);
    const data = await emptyBody.json();
    expect(data.message).toBe("No request id");
  });

  it("should stop others from removing your game request", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();
    await createTestFriendship(alice.id, bob.id);
    await setNicknameTestUser(alice.id, "alice");
    await setNicknameTestUser(eve.id, "eve");

    vi.mocked(getSignedCookie).mockResolvedValue(String(alice.id));

    const res = await gameApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: bob.id,
        firstMove: bob.id,
      }),
    });

    expect(res.status).toBe(201);
    const createdData = await res.json();
    const requestId = createdData.requestId;

    vi.mocked(getSignedCookie).mockResolvedValue(String(eve.id));

    const deletedRequest = await gameApp.request("/requests/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: requestId,
      }),
    });

    expect(deletedRequest.status).toBe(403);
    const data = await deletedRequest.json();
    expect(data.message).toBe("Not your game request");
  });

  it("should return 404 not found", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "olive");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const emptyBody = await gameApp.request("/requests/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: 1202030,
      }),
    });

    expect(emptyBody.status).toBe(404);
    const data = await emptyBody.json();
    expect(data.message).toBe("Request not found");
  });

  it("should require authentication", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "ronald");

    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await gameApp.request("/requests/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: 1202030,
      }),
    });
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.message).toBe("Not authenticated");
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
    const arData = await acceptRequest.json();
    expect(arData.message).toBe("Not your game request");
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
    const arData = await acceptRequest.json();
    expect(arData.message).toBe("Can't accept your own requests");
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
    const sentReqData = await sentReq.json();
    const reqId = sentReqData.requestId;

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const res = await gameApp.request("/requests/incoming");

    expect(res.status).toBe(200);

    const incoming = await res.json();
    expect(incoming).toHaveLength(1);
    expect(incoming[0].requestId).toBe(reqId);
    expect(incoming[0].firstMove).toBe(user2.id);
    expect(incoming[0].nickname).toBe("hedda");
    expect(incoming[0].friendId).toBe(user1.id);
  });
  it("should require validation", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "dumbo");

    const res = await gameApp.request("/requests/incoming");

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("User not found");
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

describe("Outgoing game requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should display outgoing game requests", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "boris");
    await setNicknameTestUser(user2.id, "humphrey");
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
    const sentReqData = await sentReq.json();
    const reqId = sentReqData.requestId;

    const res = await gameApp.request("/requests/outgoing");

    expect(res.status).toBe(200);

    const outgoing = await res.json();
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0].requestId).toBe(reqId);
    expect(outgoing[0].firstMove).toBe(user2.id);
    expect(outgoing[0].nickname).toBe("humphrey");
    expect(outgoing[0].friendId).toBe(user2.id);
  });
  it("should require validation", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "petunia");

    const res = await gameApp.request("/requests/outgoing");

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("User not found");
  });
  it("should return 200 OK if no requests", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "flora");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request("/requests/outgoing");
    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data).toHaveLength(0);
  });

  it("should require authentication", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "tricia");

    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await gameApp.request("/requests/outgoing");
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.message).toBe("Not authenticated");
  });
});

describe("Historic games", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should show historic games", async () => {
    const user = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();
    const friend3 = await createTestUser();
    await setNicknameTestUser(user.id, "pete");

    await createTestFriendship(user.id, friend1.id);
    await createTestFriendship(user.id, friend2.id);
    await createTestFriendship(user.id, friend3.id);

    const game1 = await createTestGame(user.id, friend1.id, user.id);
    const game2 = await createTestGame(user.id, friend2.id, user.id);
    await createTestGame(user.id, friend3.id, user.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const game1Move = await gameApp.request(`/game/${game1.id}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(game1Move.status).toBe(201);

    const game2Move = await gameApp.request(`/game/${game2.id}/move`, {
      method: "POST",
      body: JSON.stringify({ move: 0 }),
    });

    expect(game2Move.status).toBe(201);

    await alterTestGame(game1.id, "completed");
    await alterTestGame(game2.id, "forfeited");

    const res = await gameApp.request("/historic");
    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data).toHaveLength(2); // 2 tests for 1
    expect(data[0].opponentId).toBe(friend2.id); // Order by last move
    expect(data[1].opponentId).toBe(friend1.id);
  });

  it("should require authentication", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "tobias");

    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await gameApp.request("/historic");
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.message).toBe("Not authenticated");
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
    expect(gameData.firstMove).toBe(user1.id);
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
    expect(data.message).toContain("Trying to access someone else's game");
  });
  it("should return error if game doesn't exist", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "jordan");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request("/game/1234567890");
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toContain("Couldn't find game");
  });
});

describe("Get game status", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
  });
  it("should show game status", async () => {
    const user = await createTestUser();
    const receiver = await createTestUser();
    await setNicknameTestUser(user.id, "dudley");
    await createTestFriendship(user.id, receiver.id);
    const game = await createTestGame(user.id, receiver.id, user.id);
    await alterTestGame(game.id, "completed");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request(`/game/${game.id}/status`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("completed");
  });

  it("should deny access to others games", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();
    await setNicknameTestUser(eve.id, "eve");
    await createTestFriendship(alice.id, bob.id);
    const game = await createTestGame(alice.id, bob.id, alice.id);

    vi.mocked(getSignedCookie).mockResolvedValue(String(eve.id));
    const res = await gameApp.request(`/game/${game.id}/status`);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.message).toBe("Not your game");
  });

  it("should require authentication", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "timothy");

    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await gameApp.request("/game/1/status");
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.message).toBe("Not authenticated");
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
    const data = await res.json();
    expect(data.message).toBe("Move made");
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
    expect(dupMovData.message).toBe("Not your turn");
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
    expect(data.message).toContain("Not your game");
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
    const imData = await illegalMove.json();
    expect(imData.message).toBe("Game not active");
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
    const data = await res.json();
    expect(data.message).toBe("Game forfeited");
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
    const dfData = await doubleForfeit.json();
    expect(dfData.message).toBe("Game already ended");
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
    const data = await res.json();
    expect(data.message).toBe("Not your game");
  });
  it("should return error if game isn't found", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "zack");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await gameApp.request(`/game/1234567890/forfeit`, {
      method: "PATCH",
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Couldn't find game");
  });
});
