import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { countMessages } from './countMessages'
import { counts } from './counts'
import { users } from './users'

export const userCounts = pgTable(
	'user_counts',
	{
		id: serial().primaryKey(),
		userCount: integer('user_count').notNull().default(0),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		countId: integer('count_id')
			.notNull()
			.references(() => counts.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date())
	},
	t => [unique().on(t.userId, t.countId)]
)

export const userCountsRelations = relations(userCounts, ({ one, many }) => ({
	user: one(users, {
		fields: [userCounts.userId],
		references: [users.id]
	}),
	count: one(counts, {
		fields: [userCounts.countId],
		references: [counts.id]
	}),
	messages: many(countMessages)
}))
