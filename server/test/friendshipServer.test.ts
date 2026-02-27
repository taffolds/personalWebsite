import { describe, it, expect, vi, afterEach } from "vitest";

import { createTestUser, setNicknameTestUser } from "./helper.js";
import { getSignedCookie } from "hono/cookie";

vi.mock("hono/cookie", async () => {
  const actual = await vi.importActual("hono/cookie");
  return {
    ...actual,
    getSignedCookie: vi.fn(),
  };
});

import friendshipApp from "../friendshipServer.js";

describe("Search for users", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should display users", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user1.id, "alpha");
    await setNicknameTestUser(user2.id, "beta");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user2.id));

    const res = await friendshipApp.request("/search?query=alpha");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0]).toBe("alpha");
  });

  it("should return empty array when no matches", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "gamma");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/search?query=delta");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
  });

  it("should tell the user off for leaving search field blank", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "letterAfterDelta");
    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/search");

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toContain("Search field has to contain something");
  });

  it("should ban searching without nickname", async () => {
    const user = await createTestUser();
    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/search?query=nobody");
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toContain("Need to set a nickname to access resource");
  });
});

describe("Send friend requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("Should send a friend request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await setNicknameTestUser(sender.id, "Karen");
    await setNicknameTestUser(receiver.id, "Helen");

    vi.mocked(getSignedCookie).mockResolvedValue(String(sender.id));

    const res = await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Helen" }),
    });

    expect(res.status).toBe(201);
  });

  it("Should tell the user not to send duplicate requests", async () => {
    const impatient = await createTestUser();
    const unaware = await createTestUser();
    await setNicknameTestUser(impatient.id, "impetuous");
    await setNicknameTestUser(unaware.id, "oblivious");

    vi.mocked(getSignedCookie).mockResolvedValue(String(impatient.id));

    const res = await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "oblivious" }),
    });

    expect(res.status).toBe(201);

    const again = await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "oblivious" }),
    });

    expect(again.status).toBe(409);
    const data = await again.json();
    expect(data).toContain("Attempted duplicate friend request");
  });

  it("should tell the user to have a nickname to send friend requests", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "disallowed" }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toContain("Need to set a nickname to access resource");
  });

  it("should tell user not authenticated", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await friendshipApp.request("/search?query=who");

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});

describe("Pending outgoing requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("Should show pending outgoing requests", async () => {
    const user = await createTestUser();
    const potentialFriend1 = await createTestUser();
    const potentialFriend2 = await createTestUser();
    await setNicknameTestUser(user.id, "Lauren");
    await setNicknameTestUser(potentialFriend1.id, "Darren");
    await setNicknameTestUser(potentialFriend2.id, "Warren");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Darren" }),
    });

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Warren" }),
    });

    const res = await friendshipApp.request("/requests/outgoing");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.outgoingRequests).toHaveLength(2);
    expect(data.outgoingRequests[0]).toContain("Darren");
    expect(data.outgoingRequests[1]).toContain("Warren");
  });

  it("Should show no outgoing requests when there are none", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Lorene");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/outgoing");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.outgoingRequests).toHaveLength(0);
  });

  it("should tell the user needs nickname", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/outgoing");

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toContain("Need to set a nickname to access resource");
  });

  it("should tell the user not authenticated", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const res = await friendshipApp.request("/requests/outgoing");
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});

describe("Pending incoming requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should show all pending incoming requests", async () => {
    const receiver = await createTestUser();
    const sender = await createTestUser();
    await setNicknameTestUser(receiver.id, "Maria");
    await setNicknameTestUser(sender.id, "Julia");

    vi.mocked(getSignedCookie).mockResolvedValue(String(sender.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Maria" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(receiver.id));

    const res = await friendshipApp.request("/requests/incoming");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].fromNickname).toBe("Julia");
  });

  it("should show no requests when none exist", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Jude");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/incoming");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
  });

  it("should tell the user needs nickname to perform this", async () => {
    const user = await createTestUser();

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/incoming");
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toContain("Need to set a nickname to access resource");
  });

  it("should tell the user not authenticated", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const res = await friendshipApp.request("/requests/incoming");
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});

describe("Confirm friend requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should confirm friend request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await setNicknameTestUser(sender.id, "Ines");
    await setNicknameTestUser(receiver.id, "Sara");

    vi.mocked(getSignedCookie).mockResolvedValue(String(sender.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Sara" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(receiver.id));

    const incomingRes = await friendshipApp.request("/requests/incoming");
    const requests = await incomingRes.json();

    expect(requests).toHaveLength(1);
    expect(requests[0].fromNickname).toBe("Ines");

    const requestId = requests[0].requestId;

    const res = await friendshipApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId }),
    });

    expect(res.status).toBe(201);
  });

  it("should prevent user from confirming request that doesn't exist", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Hera");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: 100000,
      }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toContain("Must have request to be friends");
  });

  it("should say who do you think you are? not authenticated, that's who", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const res = await friendshipApp.request("/requests/accept", {
      method: "POST",
      body: JSON.stringify({
        userId: 1,
        confirm: "Intruder",
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toBe("Not authenticated");
  });
});

describe("Remove friend request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should remove a friend request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await setNicknameTestUser(sender.id, "Sylvia");
    await setNicknameTestUser(receiver.id, "Clara");

    vi.mocked(getSignedCookie).mockResolvedValue(String(sender.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Clara" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(receiver.id));

    const incomingRes = await friendshipApp.request("/requests/incoming");
    const requests = await incomingRes.json();

    expect(requests).toHaveLength(1);
    const requestId = requests[0].requestId;

    await friendshipApp.request("/requests/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
      }),
    });

    const res = await friendshipApp.request("/requests/incoming");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
  });

  it("shouldn't remove other people's requests", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();
    await setNicknameTestUser(alice.id, "alice");
    await setNicknameTestUser(bob.id, "bob");
    await setNicknameTestUser(eve.id, "eve");

    vi.mocked(getSignedCookie).mockResolvedValue(String(alice.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "bob" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(bob.id));

    const bobRequests = await friendshipApp.request("/requests/incoming");
    const requests = await bobRequests.json();
    const requestId = requests[0].requestId;

    vi.mocked(getSignedCookie).mockResolvedValue(String(eve.id));

    const res = await friendshipApp.request("/requests/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not your request to delete");
  });

  it("should tell the user they are not authenticated", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Locke");
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);

    const res = await friendshipApp.request("/requests/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId: 1 }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});

describe("Display a user's friends", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should display friends to a user", async () => {
    const user = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();

    await setNicknameTestUser(user.id, "Fred");
    await setNicknameTestUser(friend1.id, "Frida");
    await setNicknameTestUser(friend2.id, "Felix");

    vi.mocked(getSignedCookie).mockResolvedValue(String(friend1.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Fred" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(friend2.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Fred" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const incomingRes = await friendshipApp.request("/requests/incoming");
    const requests = await incomingRes.json();

    expect(requests).toHaveLength(2);

    const reqFrida = requests[0].requestId;
    const reqFelix = requests[1].requestId; // This is madness

    await friendshipApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: reqFrida,
      }),
    });

    await friendshipApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: reqFelix,
      }),
    });

    const res = await friendshipApp.request("/friends");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].nickname).toBe("Felix");
    expect(data[1].nickname).toBe("Frida");
  });

  it("should display no friends when there are none", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Gerald");

    vi.mocked(getSignedCookie).mockResolvedValue(String(user.id));

    const res = await friendshipApp.request("/friends");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
  });

  it("should tell the user they are not authenticated", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const res = await friendshipApp.request("/friends");
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});

describe("Delete user", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should remove a friendship", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();
    await setNicknameTestUser(sender.id, "Winston");
    await setNicknameTestUser(receiver.id, "Joseph");

    vi.mocked(getSignedCookie).mockResolvedValue(String(sender.id));

    await friendshipApp.request("/requests/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: "Joseph" }),
    });

    vi.mocked(getSignedCookie).mockResolvedValue(String(receiver.id));

    const incomingRes = await friendshipApp.request("/requests/incoming");
    const requests = await incomingRes.json();
    const requestId = requests[0].requestId;

    await friendshipApp.request("/requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
      }),
    });

    const res = await friendshipApp.request("/friends/delete", {
      method: "DELETE",
      body: JSON.stringify({
        friendId: sender.id,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toContain("Removed Winston as a friend");

    const friendsRes = await friendshipApp.request("/friends");
    const friends = await friendsRes.json();
    expect(friends).toHaveLength(0);
  });

  it("should not allow deleting some random", async () => {
    const trickster = await createTestUser();
    const unsuspecting = await createTestUser();
    await setNicknameTestUser(trickster.id, "Carlo");

    vi.mocked(getSignedCookie).mockResolvedValue(String(trickster.id));

    const res = await friendshipApp.request("/friends/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ friendId: unsuspecting.id }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toContain("Friendship not found");
  });

  it("should require authentication to delete friend", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const res = await friendshipApp.request("/friends/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ friendId: 1 }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toContain("Not authenticated");
  });
});
