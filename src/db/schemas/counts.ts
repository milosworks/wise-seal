import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { countMessages } from './countMessages'
import { guilds } from './guilds'

export const counts = pgTable('counts', {
	id: serial().primaryKey(),
	guildId: text('guild_id')
		.notNull()
		.references(() => guilds.id, { onDelete: 'cascade' }),
	match: text().notNull(),
	isRegex: boolean('is_regex').notNull(),
	count: integer().notNull().default(0),
	react: boolean().default(true),
	randomEmoji: boolean('random_emoji').notNull().default(true),
	emoji: text(),
	ignoredChannels: text('ignored_channels').array().notNull().default([]),
	ignoredUsers: text('ignored_users').array().notNull().default([]),
	createdBy: text('created_by').notNull(),
	createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date())
})

export const countsRelations = relations(counts, ({ one, many }) => ({
	guild: one(guilds, {
		fields: [counts.guildId],
		references: [guilds.id]
	}),
	messages: many(countMessages)
}))
