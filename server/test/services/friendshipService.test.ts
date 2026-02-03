// Select all friend requests
// Send a friend request
// Accept a friend request
// Decline a friend request

// Select all friends
import {
  showAllFriendRequests,
  sendFriendRequest,
  confirmFriendship,
  declineFriendRequest,
} from "../../services/friendshipService.js";
import { createTestUser } from "../helper.js";
import { describe, it, expect } from "vitest";

describe("Send friend requests", () => {
  it("should send a friend request", async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const friendRequest = await sendFriendRequest(sender.id, receiver.id);

    expect(friendRequest).not.toBeNull();
  });
});

describe("Accept friend requests", () => {
  it("should accept friend request", async () => {
    const receiver = await createTestUser();
    const sender = await createTestUser(); // on purpose on bottom

    const friendRequest = await sendFriendRequest(sender.id, receiver.id);
    expect(friendRequest).not.toBeNull();
    const friendship = await confirmFriendship(sender.id, receiver.id);
    expect(friendship).not.toBeNull();
    expect(friendship!.userId1).toBe(sender.id);
    expect(friendship!.userId2).toBe(receiver.id);
    expect(friendship!.requestedBy).toBe(sender.id);

    const remainingRequests = await showAllFriendRequests(receiver.id);
    expect(remainingRequests).toHaveLength(0);
  });
  it("must have request before friendship", async () => {
    // shouldn't pass yet, but does, keep eyes open
    const sender = await createTestUser();
    const receiver = await createTestUser();

    const friendship = await confirmFriendship(sender.id, receiver.id);

    expect(friendship).toBeNull();
  });
});

describe("Decline friend requests", () => {
  it("should decline friend requests", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const friendRequest = await sendFriendRequest(user1.id, user2.id);
    expect(friendRequest).not.toBeNull();
    await declineFriendRequest(user1.id, user2.id);
    const requests = await showAllFriendRequests(user1.id);
    expect(requests).toHaveLength(0);
  });
});

describe("Find friend requests", () => {
  it("Should find all friend requests", async () => {
    const user = await createTestUser();
    const friend1 = await createTestUser();
    const friend2 = await createTestUser();

    await sendFriendRequest(user.id, friend1.id);
    await sendFriendRequest(user.id, friend2.id);

    const friendRequests = await showAllFriendRequests(user.id);

    expect(friendRequests).not.toBeNull();
    expect(friendRequests!.requestedBy).toContain(user.id);
  });
});
