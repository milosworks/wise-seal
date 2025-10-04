import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { userCounts } from './userCounts'

export const users = pgTable('users', {
	id: text().primaryKey(),
	createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date())
})

export const usersRelations = relations(users, ({ many }) => ({
	counts: many(userCounts)
}))
