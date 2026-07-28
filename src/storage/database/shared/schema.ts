import { pgTable, serial, timestamp, unique, varchar, text, integer, index, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	summary: text().notNull(),
	content: text().notNull(),
	emoji: varchar({ length: 20 }).default('💡'),
	readTime: integer("read_time").default(5),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	slug: varchar({ length: 255 }),
}, (table) => [
	unique("blog_posts_slug_key").on(table.slug),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("users_username_key").on(table.username),
]);

export const gameRecords = pgTable("game_records", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	scenario: varchar({ length: 100 }).notNull(),
	finalScore: integer("final_score").notNull(),
	result: varchar({ length: 20 }).notNull(),
	playedAt: timestamp("played_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_game_records_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "game_records_user_id_fkey"
		}).onDelete("cascade"),
]);
