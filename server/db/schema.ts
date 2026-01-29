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

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 20 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const refreshToken = pgTable("refresh_token", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const blocked = pgTable(
  "blocked",
  {
    id: serial("id").primaryKey(),
    blocker: integer("blocker")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blocked: integer("blocked")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("unique_block_pair").on(table.blocker, table.blocked)],
);

export const friendship = pgTable(
  "friendship",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_friendship_pair").on(table.userId1, table.userId2),
  ],
);

export const friendRequest = pgTable(
  "friend_request",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestedBy: integer("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_friend_request_pair").on(table.userId1, table.userId2),
  ],
);

export const gameRequest = pgTable(
  "game_request",
  {
    id: serial("id").primaryKey(),
    userId1: integer("user_id_1")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId2: integer("user_id_2")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestedBy: integer("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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

export const game = pgTable("game", {
  id: serial("id").primaryKey(),
  playerOneId: integer("player_one_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  playerTwoId: integer("player_two_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  moves: jsonb("moves").$type<Move[]>().notNull().default([]), // come back to this!!
  currentTurn: integer("current_turn")
    .notNull()
    .references(() => user.id),
  winnerId: integer("winner_id").references(() => user.id),
  status: gameStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMoveAt: timestamp("last_move_at").notNull().defaultNow(),
});
