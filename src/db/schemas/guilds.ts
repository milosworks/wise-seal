import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { counts } from './counts'

export const guilds = pgTable('guilds', {
	id: text().primaryKey(),
	createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date())
})

export const guildsRelations = relations(guilds, ({ many }) => ({
	counts: many(counts)
}))
