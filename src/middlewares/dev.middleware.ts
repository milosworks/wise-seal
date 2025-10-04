import { createMiddleware } from 'seyfert'
import { DEV_USERS } from '../env'

export const dev = createMiddleware<void>(m => {
	if (!DEV_USERS.includes(m.context.author.id)) return m.pass()

	m.next()
})
