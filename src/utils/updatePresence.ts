import type { Client, UsingClient } from 'seyfert'
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types'

type PresencePhrase = string | ((client: Client | UsingClient) => Promise<string>)

const phrases: PresencePhrase[] = [
	'with some penguins >:)',
	'around the shore',
	async client => {
		try {
			const guild = await client.guilds.fetch(Bun.env.DEV_GUILD)
			return `with ${guild.memberCount} other seals`
		} catch (error) {
			client.logger.error('Error fetching guild member count for presence:', error)
			return 'with a large pod of seals'
		}
	},
	async client => {
		try {
			const count = (await client.guilds.list()).length
			return `in ${count} haul-out site(s)`
		} catch (error) {
			client.logger.error('Error fetching server count for presence:', error)
			return 'in a haul-out site'
		}
	}
]

export async function updatePresence(client: UsingClient & Client) {
	let phrase: string
	const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]!

	if (typeof randomPhrase === 'function') {
		phrase = await randomPhrase(client)
	} else {
		phrase = randomPhrase
	}

	client.gateway.setPresence({
		activities: [
			{
				type: ActivityType.Playing,
				name: phrase
			}
		],
		afk: false,
		since: Date.now(),
		status: PresenceUpdateStatus.DoNotDisturb
	})
}
