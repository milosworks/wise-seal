import './config/logger'

import {
	Client,
	ContextMenuCommand,
	EntryPointCommand,
	IgnoreCommand,
	type ParseClient,
	type UsingClient
} from 'seyfert'
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types'
import { join } from 'node:path'

import { constants } from './config'
import { sendLog } from './config/logger'
import { dbclient } from './database'

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
	},
	commands: {
		prefix: _ => {
			return ['.']
		}
	}
}) as UsingClient & Client

client.logger = log as any

client.commands!.onCommand = file => {
	const cmd = new file()
	if (cmd instanceof EntryPointCommand) return cmd

	cmd.guildId = [constants.guildId]

	if (!(cmd instanceof ContextMenuCommand) && cmd.ignore === undefined) cmd.ignore = IgnoreCommand.Message
	return cmd
}

client.start().then(async () => {
	log.on('data', ({ level, message }) => {
		if (level === 3) return

		sendLog(client, level, message)
	})

	await dbclient.connect()
	log.info('Database connected')

	return client.uploadCommands({
		cachePath: join(process.cwd(), 'build/_seyfert_cache_commands.json')
	})
})

declare module 'seyfert' {
	interface UsingClient extends ParseClient<Client<true>> {}

	interface InternalOptions {
		withPrefix: true
		asyncCache: false
	}
}

declare global {
	var log: import('winston').Logger
}
