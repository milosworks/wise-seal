import { type AnyColumn, eq, sql } from 'drizzle-orm'
import { createEvent, type GuildEmoji } from 'seyfert'
import { captureRegex } from '../commands/counts/create'
import { db } from '../db'
import { countMessages } from '../db/schemas/countMessages'
import { counts } from '../db/schemas/counts'
import { userCounts } from '../db/schemas/userCounts'
import { users } from '../db/schemas/users'

const discordEmojiRegex = /<a?:[\w\d]+:\d+>/g
export const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)/gm

export default createEvent({
	data: {
		name: 'messageCreate'
	},
	run: async (msg, c) => {
		if (!msg.guildId) return
		if (msg.author.bot) return

		const guildCounts = await db.select().from(counts).where(eq(counts.guildId, msg.guildId))
		if (!guildCounts.length) return

		const content = msg.content.toLowerCase().replaceAll(discordEmojiRegex, '').replaceAll(urlRegex, '')

		for (const count of guildCounts) {
			if (count.ignoredChannels.includes(msg.channelId)) continue
			if (count.ignoredUsers.includes(msg.user.id)) continue

			if (count.isRegex) {
				const regex = toRegex(count.match)
				if (!regex.test(content)) continue
			} else if (!content.toLowerCase().includes(count.match)) continue

			await db.transaction(async tx => {
				await tx.update(counts).set({ count: increment(counts.count) })
				await tx.insert(users).values({ id: msg.user.id }).onConflictDoNothing()

				const [userCount] = await tx
					.insert(userCounts)
					.values({ userId: msg.user.id, countId: count.id, userCount: 1 })
					.onConflictDoUpdate({
						target: [userCounts.userId, userCounts.countId],
						set: {
							userCount: increment(userCounts.userCount)
						}
					})
					.returning()

				await tx
					.insert(countMessages)
					.values({ messageId: msg.id, message: msg.content, countId: count.id, userCountId: userCount!.id })
			})

			if (!count.react) continue

			const hasReaction = msg.reactions?.find(x => x.me)
			if (hasReaction) await c.reactions.delete(msg.id, msg.channelId, hasReaction.emoji)

			let emoji: string | GuildEmoji
			if (count.randomEmoji && !hasReaction) {
				const list = await c.emojis.list(msg.guildId!)
				if (!list.length) continue

				const regex = count.isRegex ? toRegex(count.match) : null
				const candidates = list.filter(
					e =>
						e.name && (count.isRegex ? regex!.test(e.name) : e.name.toLowerCase().includes(count.match.toLowerCase()))
				)
				emoji = candidates[Math.floor(Math.random() * candidates.length)] ?? '✅'
			} else if (count.emoji && !hasReaction) emoji = count.emoji
			else emoji = '✅'

			await msg.react(emoji).catch(() => null)
		}
	}
})

const increment = (col: AnyColumn, value = 1) => sql`${col} + ${value}`

function toRegex(input: string): RegExp {
	const regexMatch = input.match(captureRegex)
	if (!regexMatch) throw new Error('Invalid regex format')

	const [, pattern, flags] = regexMatch
	return new RegExp(pattern!, flags)
}
