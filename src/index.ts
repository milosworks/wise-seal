import { join } from 'path'
import {
	Client,
	Embed,
	EntryPointCommand,
	Logger,
	ParseClient,
	UsingClient
} from 'seyfert'
import { LogLevels } from 'seyfert/lib/common'
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types'
import { constants } from './config'
import {
	formatMemoryUsage,
	getLoggerArgs,
	logLevelColors
} from './config/logger'
import { dbclient } from './database'

export let logger: Logger

Logger.customize((_, level, args) => {
	const date = new Date()
	const ram = formatMemoryUsage(process.memoryUsage?.()?.rss ?? 0)

	if (level !== LogLevels.Debug) {
		client.messages
			.write(constants.logsChannelId, {
				embeds: [
					new Embed()
						.setTitle('Logging event')
						.setDescription(`\`\`\`\n${args}\`\`\``)
						.setColor(logLevelColors[level])
						.addFields(
							{
								name: 'Level',
								value: `\`${LogLevels[level].toUpperCase()}\``,
								inline: true
							},
							{
								name: 'Timestamp',
								value: `\`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\``,
								inline: true
							},
							{
								name: 'RAM Usage',
								value: `\`${ram}\``,
								inline: true
							}
						)
				]
			})
			.catch(() => {})
	}

	return getLoggerArgs(level, args)
})

const client = new Client({
	presence() {
		return {
			activities: [
				{
					name: 'Sleeping',
					type: ActivityType.Custom,
					state: 'taking a nap on the beach'
				}
			],
			afk: false,
			since: Date.now(),
			status: PresenceUpdateStatus.DoNotDisturb
		}
	}
}) as UsingClient & Client

client.commands!.onCommand = (file) => {
	let cmd = new file()
	if (cmd instanceof EntryPointCommand) return cmd

	cmd.guildId = [constants.guildId]
	return cmd
}

client.start().then(async () => {
	await dbclient.connect()
	client.logger.info('Database connected')

	return client.uploadCommands({
		cachePath: join(process.cwd(), 'build/_seyfert_cache_commands.json')
	})
})

declare module 'seyfert' {
	interface UsingClient extends ParseClient<Client<true>> {}

	interface InternalOptions {
		withPrefix: false
		asyncCache: false
	}
}
