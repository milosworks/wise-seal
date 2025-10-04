import { and, eq, like } from 'drizzle-orm'
import { createBooleanOption, createStringOption, Declare, Embed, type GuildCommandContext, Options, SubCommand } from 'seyfert'
import { resolveEmoji } from 'seyfert/lib/common'
import { db } from '../../db'
import { counts } from '../../db/schemas/counts'
import { DEV_USERS } from '../../env'
import { createQuickMessage } from '../../utils/createQuickMessage'
import { emojiRegex } from './create'

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
	}),
	react: createBooleanOption({
		description: 'Update whether I should react to matching messages. Overrides emoji options.',
		required: false
	}),
	'random-emoji': createBooleanOption({
		description: 'Update if I should react with a random emoji. Falls back to ✅ if no match.',
		required: false
	}),
	'custom-emoji': createStringOption({
		description: 'Update the custom emoji used for reactions. This overrides the random emoji setting.',
		required: false,
		autocomplete: async i => {
			const input = i.getInput().trim()

			if (!input) {
				const emojis = await i.client.emojis.list(i.guildId!)
				return i.respond(emojis.slice(0, 24).map(e => ({ name: e.name ?? 'No Name', value: e.toString() })))
			}

			const partial = await resolveEmoji(input, i.client.cache)
			const isValidEmoji = partial && (partial.id || emojiRegex.test(partial.name!))

			if (isValidEmoji) {
				return i.respond([{ name: input, value: input }])
			}

			const emojis = await i.client.emojis.list(i.guildId!)
			const matches = emojis.filter(e => e.id.startsWith(input) || e.name!.startsWith(input.toLowerCase())).slice(0, 24)

			return i.respond(matches.map(e => ({ name: e.name ?? 'No Name', value: e.toString() })))
		}
	})
}

@Declare({
	name: 'edit',
	description: "Edit an existing counter's emoji and reaction settings."
})
@Options(options)
export default class Edit extends SubCommand {
	async run(ctx: GuildCommandContext<typeof options>) {
		const id = Number.parseInt(ctx.options.match)
		if (Number.isNaN(id)) return ctx.editOrReply(createQuickMessage('# Invalid Count', 'The specified count is invalid.'))

		let [doc] = await db.select().from(counts).where(eq(counts.id, id))
		if (!doc) return ctx.editOrReply(createQuickMessage('# Not Found', 'The specified count could not be found.'))

		const permissions = await ctx.member!.fetchPermissions()
		if (!(doc.createdBy === ctx.author.id || DEV_USERS.includes(ctx.author.id) || permissions.has(['ManageMessages'])))
			return ctx.editOrReply(createQuickMessage('# Not Authorized', 'You are not authorized to edit this count.'))

		const { 'custom-emoji': customEmoji, 'random-emoji': randomEmoji, react } = ctx.options

		doc = (
			await db
				.update(counts)
				.set({
					react,
					randomEmoji:
						// explicitly turn it off
						// custom emoji overrides random emoji
						// use provided value or undefined
						react === false ? false : customEmoji ? false : randomEmoji,
					emoji:
						// clear the emoji if reacting is disabled
						react === false ? null : customEmoji ? customEmoji : undefined
				})
				.returning()
		)[0]
		if (!doc)
			return ctx.editOrReply(
				createQuickMessage('# Not Found', 'The specified count could not be found after being edited.')
			)

		const embed = new Embed()
			.setColor(0x42_a5_f5)
			.setAuthor({
				name: ctx.author.name,
				iconUrl: ctx.author.avatarURL()
			})
			.setTitle('Edited Count')
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
