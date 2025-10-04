import { and, count, eq } from 'drizzle-orm'
import { ComponentCommand, type GuildComponentContext } from 'seyfert'
import { CHUNK_SIZE, createMessage } from '../../../commands/counts/list'
import { db } from '../../../db'
import { counts } from '../../../db/schemas/counts'

export default class PageButton extends ComponentCommand {
	componentType = 'Button' as const

	filter(ctx: GuildComponentContext<typeof this.componentType>) {
		return ctx.customId.startsWith('btn/list/')
	}

	async run(ctx: GuildComponentContext<typeof this.componentType>) {
		await ctx.deferUpdate()

		const [, , direction, raw, createdBy] = ctx.customId.split('/')
		const page = Number.parseInt(raw!) + (direction === 'next' ? 1 : -1)

		const total = (
			await db
				.select({ count: count() })
				.from(counts)
				.where(
					createdBy
						? and(eq(counts.guildId, ctx.guildId), eq(counts.createdBy, createdBy))
						: eq(counts.guildId, ctx.guildId)
				)
		)[0]!.count
		const results = await db
			.select()
			.from(counts)
			.where(eq(counts.guildId, ctx.guildId))
			.limit(CHUNK_SIZE)
			.offset(page * CHUNK_SIZE)

		return ctx.interaction.message.edit(createMessage(results, total, page, await ctx.guild(), createdBy))
	}
}
