import { db } from "../db/index.js";
import { friendRequests, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

let stopHidingMyShitTypeScript;
let imTryingToRememberMyThoughts;
// Select all friend requests
// Send a friend request
// Accept a friend request
// Decline a friend request

// Select all friends
// and map them in frontend

interface FriendRequestInterface {
  userId1: number;
  userId2: number;
  requestedBy: number;
  createdAt: Date;
}

export async function sendFriendRequest(
  requestedBy: number,
  sentTo: string,
): Promise<FriendRequestInterface | null> {
  const findFriend = await findUserByNickname(sentTo);
  if (!findFriend) return null;
  const [createdRequest] = await db
    .insert(friendRequests)
    .values({
      userId1: requestedBy,
      userId2: findFriend.id,
      requestedBy: requestedBy,
      createdAt: new Date(),
    })
    .returning();

  return createdRequest || null;
}

export async function findUserByNickname(nickname: string) {
  const [findFriend] = await db
    .select()
    .from(users)
    .where(eq(users.nickname, nickname)); // Maybe just be strict on this

  return findFriend || null; // Think about what I'm returning here, and to where
  // And remember this wasn't a part of TDD
}

export async function confirmFriendship(user1: number, user2: number) {
  return null as any;
}

export async function declineFriendRequest(user1: number, user2: number) {
  return null as any;
}

export async function showAllFriendRequests(userId: number) {
  return null as any;
}
