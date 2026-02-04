import { db } from "../db/index.js";
import { friendRequests, friendships, users } from "../db/schema.js";
import { eq, and, ne, or } from "drizzle-orm";

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

interface FriendshipInterface {
  userId1: number;
  userId2: number;
  createdAt: Date;
}

export async function sendFriendRequest(
  requestedBy: number,
  sentTo: string,
): Promise<FriendRequestInterface | null> {
  const findFriend = await findUserByNickname(sentTo);
  if (!findFriend) return null;

  if (!requestedBy || !findFriend.id) return null;
  const ids = [requestedBy, findFriend.id].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number;

  try {
    const createdRequest = await db
      .insert(friendRequests)
      .values({
        userId1: id1,
        userId2: id2,
        requestedBy: requestedBy,
        createdAt: new Date(),
      })
      .returning();

    return createdRequest[0] ?? null;
  } catch (error: any) {
    if (error.code === "23505") {
      console.warn("Attempted duplicate friend request");
      return null;
    }

    console.error("Unknown error: ", error.message);
    return null;
  }
}

export async function findUserByNickname(nickname: string) {
  const [findFriend] = await db
    .select()
    .from(users)
    .where(eq(users.nickname, nickname)); // Maybe just be strict on this

  return findFriend || null; // Think about what I'm returning here, and to where
  // And remember this wasn't a part of TDD
}

export async function confirmFriendship(
  user1: number,
  user2: number,
): Promise<FriendshipInterface | null> {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number; // I hate your guts TypeScript

  const existingRequest = await checkRequestExists(id1, id2);

  if (!existingRequest) return null;

  try {
    const [createdFriendship] = await db
      .insert(friendships)
      .values({
        userId1: id1,
        userId2: id2,
        createdAt: new Date(),
      })
      .returning();

    await removeFriendRequest(id1, id2);

    // Figure out transactional

    return createdFriendship ?? null;
  } catch (error) {
    console.error("Failed to create friendship: ", error);
    throw error;
  }
}

async function checkRequestExists(
  user1: number,
  user2: number,
): Promise<Boolean> {
  const existingRequest = await db
    .select()
    .from(friendRequests)
    .where(
      and(eq(friendRequests.userId1, user1), eq(friendRequests.userId2, user2)),
    );
  if (existingRequest.length > 0) {
    return true;
  } else {
    return false;
  }
}

export async function removeFriendRequest(user1: number, user2: number) {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number;

  try {
    await db
      .delete(friendRequests)
      .where(
        and(eq(friendRequests.userId1, id1), eq(friendRequests.userId2, id2)),
      );
  } catch (error) {
    console.error("Failed to remove friend request: ", error);
    throw error;
  }
}

export async function showAllFriendRequests(
  userId: number,
): Promise<FriendRequestInterface[] | []> {
  const requests = await db
    .select()
    .from(friendRequests)
    .where(
      and(
        or(
          eq(friendRequests.userId1, userId),
          eq(friendRequests.userId2, userId),
        ),
        ne(friendRequests.requestedBy, userId),
      ),
    );
  return requests;
}
