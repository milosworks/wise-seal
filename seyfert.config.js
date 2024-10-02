require('dotenv/config')
const { config } = require('seyfert')

module.exports = config.bot({
	locations: {
		base: 'src',
		output: 'build',
		commands: 'commands',
		events: 'events'
	},
	token: process.env.TOKEN ?? '',
	intents: ['GuildMembers', 'MessageContent', 'Guilds', 'GuildMessages']
})
