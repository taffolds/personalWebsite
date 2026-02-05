import { db } from "../db/index.js";
import { friendRequests, friendships, users } from "../db/schema.js";
import { eq, and, ne, or, ilike, asc, sql } from "drizzle-orm";
import { checkValidity } from "../utils/inputValidation.js";

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

// Maybe there are two checks, one to find the complete user in backend, and one that selects all users, and only sends username to frontend
// https://orm.drizzle.team/docs/rqb-v2#relations-filters
// nickname LIKE "%param%"

export async function confirmFriendship(
  user1: number,
  user2: number,
): Promise<FriendshipInterface | null> {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number; // I hate your guts TypeScript

  const existingRequest = await checkRequestExists(id1, id2);

  if (!existingRequest) return null;

  const res = await db.transaction(async (tx) => {
    const newFriendship = await tx
      .insert(friendships)
      .values({
        userId1: id1,
        userId2: id2,
        createdAt: new Date(),
      })
      .returning();

    await removeFriendRequest(id1, id2, tx);

    return newFriendship[0] ?? null;
  });

  return res;
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

export async function removeFriendRequest(
  user1: number,
  user2: number,
  client: any = db,
) {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number;

  try {
    await client
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

// magical "sql" operator, thanks drizzle
export async function showPendingRequests(userId: number) {
  const friendId = sql<number>`CASE WHEN ${friendRequests.userId1} = ${userId} THEN ${friendRequests.userId2} ELSE ${friendRequests.userId1} END`;

  const pendingRequests = await db
    .select({ nickname: users.nickname })
    .from(friendRequests)
    .innerJoin(users, eq(friendId, users.id))
    .where(eq(friendRequests.requestedBy, userId))
    .orderBy(asc(users.nickname));

  return pendingRequests.map((r) => r.nickname);
}

export async function searchForUsers(nickname: string) {
  const sanitised = checkValidity(nickname);
  if (sanitised !== "Success") throw Error(sanitised);

  const res = await db
    .select()
    .from(users)
    .where(ilike(users.nickname, `%${nickname}%`))
    .orderBy(asc(users.nickname));

  return res.map((r) => r.nickname);
}

export async function displayAllFriends(userId: number) {
  const friendId = sql<number>`CASE WHEN ${friendships.userId1} = ${userId} THEN ${friendships.userId2} ELSE ${friendships.userId1} END`;

  const res = await db
    .select({
      nickname: users.nickname,
    })
    .from(friendships)
    .innerJoin(users, eq(friendId, users.id))
    .where(or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)))
    .orderBy(asc(users.nickname));

  return res.map((r) => r.nickname);
}

export async function removeFriendship(user1: number, user2: number) {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number; // stfu TypeScript... what would it be
  // id as banana? Cut me a break...

  try {
    await db
      .delete(friendships)
      .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)));
  } catch (error) {
    console.error("Failed to remove friend: ", error);
    throw error;
  }
}
