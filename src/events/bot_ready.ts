import { createEvent } from 'seyfert'

export default createEvent({
	data: {
		name: 'botReady'
	},
	run(user) {
		user.client.logger.info(`${user.username} is galumphing`)
	}
})
