import { eq } from 'drizzle-orm'
import { createEvent } from 'seyfert'
import { db } from '../database'
import { count } from '../database/models/count'

export default createEvent({
	data: {
		name: 'messageCreate'
	},
	async run(msg) {
		try {
			if (!msg.guildId || msg.author.bot) return

			if (msg.content.toLowerCase().includes('seal')) {
				let doc = await db.query.count.findFirst()
				if (!doc) {
					doc = (await db.insert(count).values({}).returning())![0]
				}

				doc.times++
				await db
					.update(count)
					.set(doc)
					.where(eq(count.times, doc.times - 1))

				const emojis = await msg.client.emojis.list(msg.guildId)
				await msg.react(
					emojis[Math.floor(Math.random() * emojis.length)]
				)
			}
		} catch (error) {
			msg.client.logger.error(`Error when receiving message: ${error}`)
		}
	}
})
