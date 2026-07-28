import { pgTable, serial, timestamp, unique, varchar, text, integer } from "drizzle-orm/pg-core"
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
