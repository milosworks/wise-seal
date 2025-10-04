import { and, eq } from 'drizzle-orm'
import pkgEmojiRegex from 'emoji-regex'
import { createBooleanOption, createStringOption, Declare, Embed, type GuildCommandContext, Options, SubCommand } from 'seyfert'
import { resolveEmoji } from 'seyfert/lib/common'
import { db } from '../../db'
import { counts } from '../../db/schemas/counts'
import { guilds } from '../../db/schemas/guilds'
import { createQuickMessage } from '../../utils/createQuickMessage'

export const emojiRegex = pkgEmojiRegex()

const options = {
	match: createStringOption({
		description: 'The word or regex pattern to count.',
		required: true,
		min_length: 2,
		max_length: 100
	}),
	react: createBooleanOption({
		description: 'Should I react to messages that trigger a count? Overrides the next options.',
		required: false
	}),
	'random-emoji': createBooleanOption({
		description: "React with a random server emoji. I'll try to match your pattern, or use ✅ if I can't.",
		required: false
	}),
	'custom-emoji': createStringOption({
		description: 'Specify a custom emoji to react with. Overrides "Random Emoji".',
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
	name: 'create',
	description: 'Creates a new counter. Each time a word or regex pattern is used, the counter increases by one.'
})
@Options(options)
export default class Create extends SubCommand {
	async run(ctx: GuildCommandContext<typeof options>) {
		const [guild] = await db.select().from(guilds).where(eq(guilds.id, ctx.guildId))
		if (!guild) await db.insert(guilds).values({ id: ctx.guildId })

		const { react, 'custom-emoji': customEmoji, 'random-emoji': randomEmoji } = ctx.options

		let match: string
		let isRegex: boolean
		try {
			const parsed = parseMatch(ctx.options.match)
			match = parsed.match
			isRegex = parsed.isRegex
		} catch (_) {
			return ctx.editOrReply(
				createQuickMessage(
					'# Invalid Pattern',
					"That looks like a regular expression, but it couldn't be parsed. Please check for typos or missing characters."
				)
			)
		}

		const [exists] = await db
			.select()
			.from(counts)
			.where(and(eq(counts.guildId, ctx.guildId), eq(counts.match, match)))
		if (exists)
			return ctx.editOrReply(
				createQuickMessage('# Already Exists', "There's already a counter with that match in this server.")
			)

		const [doc] = await db
			.insert(counts)
			.values({
				guildId: ctx.guildId,
				match,
				isRegex,
				react,
				// If react is truthy:
				//  • customEmoji overrides randomEmoji → randomEmoji = false
				//  • otherwise keep randomEmoji as-is
				// If react is falsy, leave randomEmoji undefined
				randomEmoji: (react ?? true) ? (customEmoji ? false : randomEmoji) : undefined,
				// If react is truthy and customEmoji is provided, use it; otherwise undefined
				emoji: (react ?? true) && customEmoji ? customEmoji : undefined,
				createdBy: ctx.author.id
			})
			.returning()

		const embed = new Embed()
			.setColor(0x4c_af_50)
			.setAuthor({
				name: ctx.author.name,
				iconUrl: ctx.author.avatarURL()
			})
			.setTitle('Created new Count')
			.setDescription(`Match: **${match}**`)
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

const testRegex = /^\/.*\/[gimsuy]*$/
export const captureRegex = /^\/(.*)\/([gimsuy]*)$/

function parseMatch(input: string): { match: string; isRegex: boolean } {
	if (testRegex.test(input)) {
		try {
			const [, pattern, flags] = input.match(captureRegex)!
			new RegExp(pattern!, flags)
			return { match: input, isRegex: true }
		} catch {
			throw new Error('Invalid regular expression.')
		}
	}
	return { match: input.toLowerCase(), isRegex: false }
}
