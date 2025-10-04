import { exists, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { Client, Formatter, type ParseClient, type ParseMiddlewares, type UsingClient } from 'seyfert'
import { db } from './db'
import { middlewares } from './middlewares'
import { createQuickMessage } from './utils/createQuickMessage'
import { updatePresence } from './utils/updatePresence'

const client = new Client({
	commands: {
		defaults: {
			onRunError(ctx, error) {
				return ctx.editOrReply(
					createQuickMessage(
						'# Error',
						Formatter.codeBlock(
							(error instanceof Error
								? (error.stack ?? error.message)
								: typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
									? error.message
									: 'Unknown error'
							).slice(0, 1500),
							'ts'
						)
					)
				)
			},
			onMiddlewaresError: (ctx, error) => ctx.editOrReply(createQuickMessage('# Error', error)),
			onOptionsError(ctx, metadata) {
				return ctx.editOrReply(
					createQuickMessage(
						'# Options Error',
						...Object.entries(metadata)
							.filter(([, value]) => value.failed)
							.map(([key, value]) => `**${key}:** ${value.value as string}`)
					)
				)
			}
		},
		prefix: () => ['.']
	}
}) as UsingClient & Client

if (!(await exists('./cache'))) await mkdir('./cache')

client.db = db

client.setServices({
	middlewares
})

await client.start()
await client.uploadCommands({
	cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
})

await updatePresence(client)

setInterval(updatePresence.bind(null, client), 60e3 * 5)

declare module 'bun' {
	interface Env extends Record<'DATABASE_URL' | 'DISCORD_TOKEN' | 'DEV_USERS' | 'DEV_GUILD', string> {}
}

declare module 'seyfert' {
	interface UsingClient extends ParseClient<Client<true>> {
		db: typeof db
	}

	interface RegisteredMiddlewares extends ParseMiddlewares<typeof middlewares> {}

	interface InternalOptions {
		withPrefix: true
	}
}
