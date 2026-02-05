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
    await setNicknameTestUser(receiver.id, "bob");

    const friendRequest = await sendFriendRequest(sender.id, "bob");

    expect(friendRequest).not.toBeNull();
    expect(friendRequest!.userId1).toBe(sender.id);
    expect(friendRequest!.userId2).toBe(receiver.id);
  });

  it("should prevent duplicate friend requests", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await setNicknameTestUser(sender.id, "Kelly");
    await setNicknameTestUser(receiver.id, "Polly");

    const friendRequest = await sendFriendRequest(sender.id, "Polly");
    expect(friendRequest).not.toBeNull();

    const duplicateRequest = await sendFriendRequest(receiver.id, "Kelly");
    expect(duplicateRequest).toBeNull();
  });
  it("should stop you from friend requesting yourself", async () => {
    const mrLonely = await createTestUser();
    await setNicknameTestUser(mrLonely.id, "friendMe");

    await sendFriendRequest(mrLonely.id, "friendMe");
    const noRequestsToSelf = await showAllFriendRequests(mrLonely.id);
    expect(noRequestsToSelf).toHaveLength(0);
  });
});

describe("Accept friend requests", () => {
  it("should accept friend request", async () => {
    const receiver = await createTestUser();
    const sender = await createTestUser(); // on purpose on bottom
    await setNicknameTestUser(receiver.id, "John");

    const friendRequest = await sendFriendRequest(sender.id, "John");
    expect(friendRequest).not.toBeNull();
    const friendship = await confirmFriendship(sender.id, receiver.id);
    const [id1, id2] = [sender.id, receiver.id].sort((a, b) => a - b);
    expect(friendship).not.toBeNull();
    expect(friendship!.userId1).toBe(id1);
    expect(friendship!.userId2).toBe(id2);

    const remainingRequests = await showAllFriendRequests(receiver.id);
    expect(remainingRequests).toHaveLength(0);
  });
  it("must have request before friendship", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const friendship = await confirmFriendship(sender.id, receiver.id);

    expect(friendship).toBeNull();
  });
  it("Should prevent friend requests when already friends", async () => {});
});

describe("Decline friend requests", () => {
  it("should decline friend requests", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await setNicknameTestUser(user2.id, "Sally");

    const friendRequest = await sendFriendRequest(user1.id, "Sally");
    expect(friendRequest).not.toBeNull();
    await removeFriendRequest(user1.id, user2.id);
    const requests = await showAllFriendRequests(user1.id);
    expect(requests).toHaveLength(0);
  });
});

describe("Find friend requests", () => {
  it("Should find all friend requests", async () => {
    const receiver = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();
    await setNicknameTestUser(receiver.id, "Sara");

    await sendFriendRequest(friend1.id, "Sara");
    await sendFriendRequest(friend2.id, "Sara");

    const friendRequests = await showAllFriendRequests(receiver.id);

    expect(friendRequests).not.toBeNull();
    expect(friendRequests).toHaveLength(2);
    expect(friendRequests[0]!.requestedBy).toBe(friend1.id);
    expect(friendRequests[1]!.requestedBy).toBe(friend2.id);
  });
});

describe("Show outgoing requests", () => {
  it("should show outgoing requests", async () => {
    const receiver1 = await createTestUser();
    const receiver2 = await createTestUser();
    const sender = await createTestUser();

    await setNicknameTestUser(receiver1.id, "Jack"); // and
    await setNicknameTestUser(receiver2.id, "Jill"); // went up the hill

    await sendFriendRequest(sender.id, "Jack");
    await sendFriendRequest(sender.id, "Jill");

    const outgoingRequests = await showPendingRequests(sender.id);

    expect(outgoingRequests).toHaveLength(2);
    expect(outgoingRequests[0].userId1).toBe(receiver1.id);
    expect(outgoingRequests[1].userId2).toBe(receiver2.id); // Given the order they are created
    // Or should this be alphabetical?
  });

  it("should remove an outgoing request", async () => {
    // redundant?
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await setNicknameTestUser(receiver.id, "James");

    const outgoingRequests = await showPendingRequests(sender.id);
    expect(outgoingRequests).toHaveLength(1);

    await removeFriendRequest(sender.id, receiver.id);
    expect(outgoingRequests).toHaveLength(0);
  });
});

describe("Search for friends", () => {
  it("should display the nickname from search", async () => {
    const user = await createTestUser();
    await setNicknameTestUser(user.id, "Jane");

    const searchResults = await searchForUsers("Jane");
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]).toBe(user.nickname);
  });

  it("should only display people within search params", async () => {
    // am I testing drizzle or logic... hmmm
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await setNicknameTestUser(user1.id, "Jen");
    await setNicknameTestUser(user2.id, "Ben");

    const searchResults = await searchForUsers("Jen");
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]).toBe(user1.nickname);
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
    expect(searchResults[0]).toBe(user2.nickname);
    expect(searchResults[1]).toBe(user3.nickname);
    expect(searchResults[2]).toBe(user1.nickname); // checking ordering working, lowest id, but alphabetically last
  });
});

describe("Display friends", () => {
  it("should display friends belonging to account", async () => {
    const sender = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();

    await setNicknameTestUser(friend1.id, "Vera");
    await setNicknameTestUser(friend2.id, "Hera");

    await sendFriendRequest(sender.id, "Vera");
    await sendFriendRequest(sender.id, "Hera");

    await confirmFriendship(sender.id, friend1.id);
    await confirmFriendship(sender.id, friend2.id);

    const friendList = await displayAllFriends(sender.id);
    // Also alphabetical
    expect(friendList).toHaveLength(2);
    expect(friendList[0]).toBe("Hera");
    expect(friendList[1]).toBe("Vera");
  });

  it("should not display others relationships", async () => {
    // more a test to make sure I don't forget stuff
    const alice = await createTestUser();
    const bob = await createTestUser();
    const eve = await createTestUser();

    await setNicknameTestUser(bob.id, "bob");
    await sendFriendRequest(alice.id, "bob");
    await confirmFriendship(alice.id, bob.id);

    const eveFriends = await displayAllFriends(eve.id);
    expect(eveFriends).toHaveLength(0);
  });
});

// Include some blocking logic later
describe("Remove friends", () => {
  it("should remove a friendship", async () => {
    const seriouslyPetty = await createTestUser();
    const futureEnemy = await createTestUser();

    await setNicknameTestUser(futureEnemy.id, "nemesis");
    await sendFriendRequest(seriouslyPetty.id, "nemesis");
    await confirmFriendship(seriouslyPetty.id, futureEnemy.id);
    const oldFriends = await displayAllFriends(seriouslyPetty.id);
    expect(oldFriends).toHaveLength(1);

    await removeFriendship(seriouslyPetty.id, futureEnemy.id);
    const newFriends = await displayAllFriends(seriouslyPetty.id);
    expect(newFriends).toHaveLength(0);
  });
});
