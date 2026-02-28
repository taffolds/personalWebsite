// Select all friend requests
// Send a friend request
// Accept a friend request
// Decline a friend request

// Select all friends

import {
  showAllFriendRequests,
  sendFriendRequest,
  confirmFriendship,
  removeFriendRequest,
  showPendingRequests,
  searchForUsers,
  displayAllFriends,
  removeFriendship,
} from "../../services/friendshipService.js";
import { createTestUser, setNicknameTestUser } from "../helper.js";
import { describe, it, expect } from "vitest";

describe("Send friend requests", () => {
  it("should send a friend request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const friendRequest = await sendFriendRequest(sender.id, receiver.id);

    expect(friendRequest).not.toBeNull();
    expect(friendRequest!.userId1).toBe(sender.id);
    expect(friendRequest!.userId2).toBe(receiver.id);
  });

  it("should prevent duplicate friend requests", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const friendRequest = await sendFriendRequest(sender.id, receiver.id);
    expect(friendRequest).not.toBeNull();

    const duplicateRequest = await sendFriendRequest(receiver.id, sender.id);
    expect(duplicateRequest).toBeNull();
  });
  it("should stop you from friend requesting yourself", async () => {
    const mrLonely = await createTestUser();

    await sendFriendRequest(mrLonely.id, mrLonely.id);
    const noRequestsToSelf = await showAllFriendRequests(mrLonely.id);
    expect(noRequestsToSelf).toHaveLength(0);
  });
});

describe("Accept friend requests", () => {
  it("should accept friend request", async () => {
    const receiver = await createTestUser();
    const sender = await createTestUser(); // on purpose on bottom

    const friendRequest = await sendFriendRequest(sender.id, receiver.id);
    expect(friendRequest).not.toBeNull();

    const incomingRequests = await showAllFriendRequests(receiver.id);
    expect(incomingRequests).toHaveLength(1);
    const requestId = incomingRequests[0]!.requestId;

    const friendship = await confirmFriendship(requestId, receiver.id);
    const [id1, id2] = [sender.id, receiver.id].sort((a, b) => a - b);
    expect(friendship).not.toBeNull();
    expect(friendship!.userId1).toBe(id1);
    expect(friendship!.userId2).toBe(id2);

    const remainingRequests = await showAllFriendRequests(receiver.id);
    expect(remainingRequests).toHaveLength(0);
  });
  it("must have request before friendship", async () => {
    const receiver = await createTestUser();

    const friendship = await confirmFriendship(102939, receiver.id);

    expect(friendship).toBeNull();
  });
  it("Should prevent friend requests when already friends", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await sendFriendRequest(sender.id, receiver.id);
    const requests = await showAllFriendRequests(receiver.id);
    await confirmFriendship(requests[0]!.requestId, receiver.id);

    const friends = await displayAllFriends(sender.id);
    expect(friends).toHaveLength(1);

    const duplicateRequest = await sendFriendRequest(sender.id, receiver.id);
    expect(duplicateRequest).toBeNull();
  });
});

describe("Decline friend requests", () => {
  it("should decline friend requests", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const friendRequest = await sendFriendRequest(user1.id, user2.id);
    expect(friendRequest).not.toBeNull();

    const requests = await showAllFriendRequests(user2.id);
    const requestId = requests[0]!.requestId;

    const removed = await removeFriendRequest(requestId, user2.id);
    expect(removed).toBe(true);
    const remainingRequests = await showAllFriendRequests(user1.id);
    expect(remainingRequests).toHaveLength(0);
  });
});

describe("Find friend requests", () => {
  it("Should find all friend requests", async () => {
    const receiver = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();
    await setNicknameTestUser(friend1.id, "Liz");
    await setNicknameTestUser(friend2.id, "Gertrude");

    await sendFriendRequest(friend1.id, receiver.id);
    await sendFriendRequest(friend2.id, receiver.id);

    const friendRequests = await showAllFriendRequests(receiver.id);

    expect(friendRequests).not.toBeNull();
    expect(friendRequests).toHaveLength(2);

    expect(friendRequests[0]!.fromUserId).toBe(friend1.id);
    expect(friendRequests[1]!.fromUserId).toBe(friend2.id);
    expect(friendRequests[0]!.fromNickname).toBe("Liz");
    expect(friendRequests[1]!.fromNickname).toBe("Gertrude");
  });
});

describe("Show outgoing requests", () => {
  it("should show outgoing requests", async () => {
    const receiver1 = await createTestUser();
    const receiver2 = await createTestUser();
    const sender = await createTestUser();

    await setNicknameTestUser(receiver1.id, "Jack"); // and
    await setNicknameTestUser(receiver2.id, "Jill"); // went up the hill

    await sendFriendRequest(sender.id, receiver1.id);
    await sendFriendRequest(sender.id, receiver2.id);

    const outgoingRequests = await showPendingRequests(sender.id);

    expect(outgoingRequests).toHaveLength(2);
    expect(outgoingRequests[0]).toBe("Jack");
    expect(outgoingRequests[1]).toBe("Jill");
  });

  it("should remove an outgoing request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await sendFriendRequest(sender.id, receiver.id);

    const outgoingRequestsBefore = await showPendingRequests(sender.id);
    expect(outgoingRequestsBefore).toHaveLength(1);

    const allRequests = await showAllFriendRequests(receiver.id);
    const requestId = allRequests[0]!.requestId;

    await removeFriendRequest(requestId, sender.id);

    const outgoingRequestsAfter = await showPendingRequests(sender.id);
    expect(outgoingRequestsAfter).toHaveLength(0);
  });
});

describe("Search for friends", () => {
  it("should display the nickname from search", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Jane");

    const searchResults = await searchForUsers("Jane");
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]!.nickname).toBe("Jane");
  });

  it("should only display people within search params", async () => {
    // am I testing drizzle or logic... hmmm
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await setNicknameTestUser(user1.id, "Jen");
    await setNicknameTestUser(user2.id, "Ben");

    const searchResults = await searchForUsers("Jen");
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]!.nickname).toBe("Jen");
  });

  it("should display all users containing 'ha'", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();
    const user4 = await createTestUser();

    await setNicknameTestUser(user1.id, "SHaNe");
    await setNicknameTestUser(user2.id, "Hank");
    await setNicknameTestUser(user3.id, "haNNa");
    await setNicknameTestUser(user4.id, "Herbert");

    const searchResults = await searchForUsers("hA");
    // return search alphabetically
    expect(searchResults).toHaveLength(3);
    expect(searchResults[0]!.nickname).toBe("Hank");
    expect(searchResults[1]!.nickname).toBe("haNNa");
    expect(searchResults[2]!.nickname).toBe("SHaNe"); // checking ordering working, lowest id, but alphabetically last
  });
});

describe("Display friends", () => {
  it("should display friends belonging to account", async () => {
    const sender = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();

    await setNicknameTestUser(friend1.id, "Vera");
    await setNicknameTestUser(friend2.id, "Hera");

    await sendFriendRequest(sender.id, friend1.id);
    await sendFriendRequest(sender.id, friend2.id);

    const incomingFriend1 = await showAllFriendRequests(friend1.id);
    const incomingFriend2 = await showAllFriendRequests(friend2.id);

    await confirmFriendship(incomingFriend1[0]!.requestId, friend1.id);
    await confirmFriendship(incomingFriend2[0]!.requestId, friend2.id);

    const friendList = await displayAllFriends(sender.id);
    expect(friendList).toHaveLength(2);
    expect(friendList[0]!.nickname).toBe("Hera");
    expect(friendList[1]!.nickname).toBe("Vera");
  });

  it("should not display others relationships", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();

    await sendFriendRequest(alice.id, bob.id);
    const req = await showAllFriendRequests(bob.id);
    await confirmFriendship(req[0]!.requestId, bob.id);

    const eveFriends = await displayAllFriends(eve.id);
    expect(eveFriends).toHaveLength(0);
  });
});

// Include some blocking logic later
describe("Remove friends", () => {
  it("should remove a friendship", async () => {
    const seriouslyPetty = await createTestUser();
    const futureEnemy = await createTestUser();

    await sendFriendRequest(seriouslyPetty.id, futureEnemy.id);

    const requests = await showAllFriendRequests(futureEnemy.id);
    const requestId = requests[0]!.requestId;

    await confirmFriendship(requestId, futureEnemy.id);
    const oldFriends = await displayAllFriends(seriouslyPetty.id);
    expect(oldFriends).toHaveLength(1);

    await removeFriendship(seriouslyPetty.id, futureEnemy.id);
    const newFriends = await displayAllFriends(seriouslyPetty.id);
    expect(newFriends).toHaveLength(0);
  });
});
