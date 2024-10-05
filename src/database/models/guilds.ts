import { sql } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const guilds = pgTable('guilds', {
	id: text('id').primaryKey(),
	sealCount: integer('seal_count').notNull().default(0),
	ignoredChannels: text('ignored_channels')
		.array()
		.notNull()
		.default(sql`'{}'::text[]`)
})
