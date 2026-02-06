import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("game_status", [
  "in_progress",
  "completed",
  "draw",
  "forfeited",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 20 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    blocker: integer("blocker")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blocked: integer("blocked")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("unique_block_pair").on(table.blocker, table.blocked)],
);

export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_friendship_pair").on(table.userId1, table.userId2),
  ],
);

export const friendRequests = pgTable(
  "friend_requests",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedBy: integer("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_friend_request_pair").on(table.userId1, table.userId2),
  ],
);

export const gameRequests = pgTable(
  "game_requests",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedBy: integer("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_game_request_pair").on(table.userId1, table.userId2),
  ],
);

type Move = {
  player: number;
  column: number;
  timestamp: string;
};

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  playerOneId: integer("player_one_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  playerTwoId: integer("player_two_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  moves: jsonb("moves").$type<Move[]>().notNull().default([]), // come back to this!!
  currentTurn: integer("current_turn")
    .notNull()
    .references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
  status: gameStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMoveAt: timestamp("last_move_at").notNull().defaultNow(),
});
