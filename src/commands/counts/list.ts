import { and, count, eq } from 'drizzle-orm'
import {
	ActionRow,
	Button,
	Container,
	createUserOption,
	Declare,
	type Guild,
	type GuildCommandContext,
	Options,
	Section,
	Separator,
	SubCommand,
	TextDisplay,
	Thumbnail
} from 'seyfert'
import type { InteractionCreateBodyRequest } from 'seyfert/lib/common'
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types'
import { db } from '../../db'
import { counts } from '../../db/schemas/counts'
import { createQuickMessage } from '../../utils/createQuickMessage'

const options = {
	'created-by': createUserOption({
		description: 'Filter counts created by this user.',
		required: false
	})
}

export const CHUNK_SIZE = 10

@Declare({
	name: 'list',
	description: 'Lists all the current counts in this guild.'
})
@Options(options)
export default class List extends SubCommand {
	async run(ctx: GuildCommandContext<typeof options>) {
		const { 'created-by': createdBy } = ctx.options

		const { count: total } = (
			await db
				.select({ count: count() })
				.from(counts)
				.where(
					createdBy
						? and(eq(counts.guildId, ctx.guildId), eq(counts.createdBy, createdBy.id))
						: eq(counts.guildId, ctx.guildId)
				)
		)[0]!
		if (!total)
			return ctx.editOrReply(
				createQuickMessage(
					'# Not Found',
					createdBy
						? 'This user does not have any counts created on this guild.'
						: 'This guild does not have any counts.'
				)
			)

		const results = await db
			.select()
			.from(counts)
			.where(
				createdBy
					? and(eq(counts.guildId, ctx.guildId), eq(counts.createdBy, createdBy.id))
					: eq(counts.guildId, ctx.guildId)
			)
			.limit(CHUNK_SIZE)
		const guild = await ctx.guild()

		return ctx.editOrReply(createMessage(results, total, 0, guild, createdBy?.id))
	}
}

export function createMessage(
	results: (typeof counts.$inferSelect)[],
	total: number,
	index: number,
	guild: Guild<'cached' | 'api'>,
	createdBy: string | undefined
): InteractionCreateBodyRequest {
	const container = new Container()
	const content = `# Counts\nTheres **${total}** counts in ${guild.name} ||(${guild.id})||${createdBy ? `\n-# Filtering by creator: <@${createdBy}>` : ''}`

	container.addComponents(
		guild.icon
			? new Section()
					.addComponents(new TextDisplay({ content }))
					.setAccessory(new Thumbnail({ media: { url: guild.iconURL()! } }))
			: new TextDisplay({ content })
	)

	container.addComponents(
		...results.map(x => {
			let opStr: undefined | string
			if (!x.react) {
				opStr = 'React to Message: **False**'
			} else if (x.emoji) {
				opStr = `Emoji: **${x.emoji}**`
			} else if (x.randomEmoji) {
				opStr = 'Random Emoji: **True**'
			}

			return new TextDisplay({
				content: `**${x.match}**${x.count ? ` *- ${x.count}*` : ''}\n${opStr ? `-# ${opStr}\n` : ''}-# By: <@${x.createdBy}> | At: <t:${x.createdAt.getTime() / 1000}:f>`
			})
		}),
		new Separator()
	)

	if (total > CHUNK_SIZE)
		container.addComponents(
			new ActionRow().addComponents(
				new Button({
					custom_id: `btn/list/back/${index}/${createdBy ?? ''}`,
					disabled: index === 0,
					emoji: { name: '◀️' },
					style: ButtonStyle.Primary
				}),
				new Button({
					custom_id: `btn/list/next/${index}/${createdBy ?? ''}`,
					disabled: index + 1 === Math.ceil(total / CHUNK_SIZE),
					emoji: { name: '▶️' },
					style: ButtonStyle.Primary
				})
			)
		)

	container.addComponents(new TextDisplay({ content: `-# ${index + 1}/${Math.ceil(total / CHUNK_SIZE)} (Counts: ${total})` }))

	return {
		components: [container],
		flags: MessageFlags.IsComponentsV2,
		allowed_mentions: { users: [] }
	}
}
