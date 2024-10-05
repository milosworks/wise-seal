import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	sealCount: integer('seal_count').notNull().default(0),
	ignoreCount: boolean('ignore_count').notNull().default(false)
})
