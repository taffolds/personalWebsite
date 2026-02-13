import { db } from "../db/index.js";
import { friendRequests, friendships, users } from "../db/schema.js";
import { eq, and, ne, or, ilike, asc, sql } from "drizzle-orm";
import { checkValidity } from "../utils/inputValidation.js";

interface FriendRequestInterface {
  id: number;
  userId1: number;
  userId2: number;
  requestedBy: number;
  createdAt: Date;
}

interface FriendshipInterface {
  id: number;
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

  const existingFriendship = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)));

  if (existingFriendship.length > 0) {
    console.warn("Cannot send friend request - already friends");
    return null;
  }

  try {
    // Why is this in try catch? I'm checking the same thing further up
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

  return findFriend || null;
}

// Maybe there are two checks, one to find the complete user in backend, and one that selects all users, and only sends username to frontend
// https://orm.drizzle.team/docs/rqb-v2#relations-filters
// nickname LIKE "%param%"

export async function confirmFriendship(
  requestId: number,
  userId: number,
): Promise<FriendshipInterface | null> {
  const [request] = await db
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId));

  if (!request) return null;

  const isReceiver =
    (request.userId1 === userId || request.userId2 === userId) &&
    request.requestedBy !== userId;

  if (!isReceiver) return null;

  const ids = [request.userId1, request.userId2].sort((a, b) => a - b); // Should be sorted already... consider removing
  const id1 = ids[0] as number;
  const id2 = ids[1] as number;

  const res = await db.transaction(async (tx) => {
    const newFriendship = await tx
      .insert(friendships)
      .values({
        userId1: id1,
        userId2: id2,
        createdAt: new Date(),
      })
      .returning();

    await tx.delete(friendRequests).where(eq(friendRequests.id, requestId));

    return newFriendship[0] ?? null;
  });

  return res;
}

export async function removeFriendRequest(requestId: number, userId: number) {
  const [request] = await db
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId));

  if (!request) return false;

  const isPartOfIt = request.userId1 === userId || request.userId2 === userId;

  if (!isPartOfIt) return false;

  try {
    await db.delete(friendRequests).where(eq(friendRequests.id, requestId));
    return true;
  } catch (error) {
    console.error("Failed to remove friend request: ", error);
    throw error;
  }
}

export async function showAllFriendRequests(userId: number) {
  const fromUserId = sql<number>`CASE WHEN ${friendRequests.userId1} = ${userId} THEN ${friendRequests.userId2} ELSE ${friendRequests.userId1} END`;

  const requests = await db
    .select({
      requestId: friendRequests.id,
      fromUserId: fromUserId,
      fromNickname: users.nickname,
      createdAt: friendRequests.createdAt,
    })
    .from(friendRequests)
    .innerJoin(users, eq(fromUserId, users.id))
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
      userId: friendId,
      nickname: users.nickname,
    })
    .from(friendships)
    .innerJoin(users, eq(friendId, users.id))
    .where(or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)))
    .orderBy(asc(users.nickname));

  return res;
}

export async function removeFriendship(
  user1: number,
  user2: number,
): Promise<FriendshipInterface | null> {
  const ids = [user1, user2].sort((a, b) => a - b);
  const id1 = ids[0] as number;
  const id2 = ids[1] as number; // stfu TypeScript... what would it be
  // id as banana? Cut me a break...

  try {
    const res = await db
      .delete(friendships)
      .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)))
      .returning();

    return res[0] ?? null;
  } catch (error) {
    console.error("Failed to remove friend: ", error);
    throw error;
  }
}
