import { config } from 'seyfert'
import { GatewayIntentBits } from 'seyfert/lib/types'

const BOT_TOKEN = Bun.env.DISCORD_TOKEN
if (!BOT_TOKEN?.trim()) throw new Error('Bun.env.BOT_TOKEN is not a valid token')

export default config.bot({
	token: BOT_TOKEN ?? '',
	locations: {
		base: 'src',
		commands: 'commands',
		components: 'components',
		events: 'events'
	},
	intents: GatewayIntentBits.NonPrivilaged | GatewayIntentBits.OnlyPrivilaged
})
