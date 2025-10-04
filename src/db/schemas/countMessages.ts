import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { counts } from './counts'
import { userCounts } from './userCounts'

export const countMessages = pgTable('count_messages', {
	id: serial().primaryKey(),
	countId: integer('count_id')
		.notNull()
		.references(() => counts.id, { onDelete: 'cascade' }),
	message: text().notNull(),
	messageId: text('message_id').notNull(),
	userCountId: integer('user_count_id')
		.notNull()
		.references(() => userCounts.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).notNull().defaultNow()
})

export const countMessagesRelations = relations(countMessages, ({ one }) => ({
	count: one(counts, {
		fields: [countMessages.countId],
		references: [counts.id]
	}),
	userCount: one(userCounts, {
		fields: [countMessages.userCountId],
		references: [userCounts.id]
	})
}))
