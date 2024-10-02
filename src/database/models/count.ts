import { integer, pgTable } from 'drizzle-orm/pg-core'

export const count = pgTable('count', {
	times: integer('times').notNull().default(0)
})
