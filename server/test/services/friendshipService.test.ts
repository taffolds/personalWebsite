// Select all friend requests
// Send a friend request
// Accept a friend request
// Decline a friend request

// Select all friends

//USER SHOULD ABLE TO SEE PENDING REQUESTS THEY'VE SENT, AND DELETE PENDING REQUEST
import {
  showAllFriendRequests,
  sendFriendRequest,
  confirmFriendship,
  removeFriendRequest,
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
  // Messy test, needed total refactor when I realised
  it("Should find all friend requests", async () => {
    // who the recipient was
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
