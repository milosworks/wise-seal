import { and, eq, like } from 'drizzle-orm'
import { createStringOption, Declare, Embed, type GuildCommandContext, Options, SubCommand } from 'seyfert'
import { db } from '../../db'
import { counts } from '../../db/schemas/counts'
import { DEV_USERS } from '../../env'
import { createQuickMessage } from '../../utils/createQuickMessage'

const options = {
	match: createStringOption({
		description: 'The word or regex pattern to search for.',
		required: true,
		autocomplete: async i => {
			const permissions = await i.member!.fetchPermissions()
			const input = i.getInput().trim()
			const results = await db
				.select()
				.from(counts)
				.where(
					and(
						eq(counts.guildId, i.guildId!),
						DEV_USERS.includes(i.user.id) || permissions.has(['ManageMessages'])
							? like(counts.match, `%${input}%`)
							: and(eq(counts.createdBy, i.user.id), like(counts.match, `%${input}%`))
					)
				)

			return i.respond(results.map(x => ({ name: x.match, value: x.id.toString() })))
		}
	})
}

@Declare({
	name: 'delete',
	description: 'Deletes a specific count from this guild.'
})
@Options(options)
export default class Delete extends SubCommand {
	async run(ctx: GuildCommandContext<typeof options>) {
		const id = Number.parseInt(ctx.options.match)
		if (Number.isNaN(id)) return ctx.editOrReply(createQuickMessage('# Invalid Count', 'The specified count is invalid.'))

		const [doc] = await db.select().from(counts).where(eq(counts.id, id))
		if (!doc) return ctx.editOrReply(createQuickMessage('# Not Found', 'The specified count could not be found.'))

		const permissions = await ctx.member!.fetchPermissions()
		if (!(doc.createdBy === ctx.author.id || DEV_USERS.includes(ctx.author.id) || permissions.has(['ManageMessages'])))
			return ctx.editOrReply(createQuickMessage('# Not Authorized', 'You are not authorized to delete this count.'))

		await db.delete(counts).where(eq(counts.id, id))

		const embed = new Embed()
			.setColor(0xc6_28_28)
			.setAuthor({
				name: ctx.author.name,
				iconUrl: ctx.author.avatarURL()
			})
			.setTitle('Deleted Count')
			.setDescription(`Match: **${doc.match}**`)
			.setTimestamp()

		if (doc!.react) embed.addFields({ name: 'React to Message', value: 'True', inline: true })
		if (doc!.emoji)
			embed.addFields({
				name: 'Custom Emoji',
				value: doc!.emoji,
				inline: true
			})
		if (doc!.randomEmoji)
			embed.addFields({
				name: 'Random Emoji',
				value: 'True',
				inline: true
			})

		return ctx.editOrReply({ embeds: [embed] })
	}
}
