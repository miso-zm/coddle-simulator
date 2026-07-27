import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	summary: text().notNull(),
	content: text().notNull(),
	emoji: varchar({ length: 20 }).default('💡'),
	readTime: integer("read_time").default(5),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
