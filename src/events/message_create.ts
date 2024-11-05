import { sql } from 'drizzle-orm'
import { createEvent, type Message } from 'seyfert'
import { db } from '../database'
import { guilds } from '../database/models/guilds'
import { users } from '../database/models/users'

const tikTokRegex = /(https?:\/\/)?(www\.|vm\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|t\/[\w-]+|[\w-]+)\/?/gi

export default createEvent({
	data: {
		name: 'messageCreate'
	},
	async run(msg) {
		if (msg.author.bot) return

		try {
			runTiktokParse(msg)
			await runCount(msg)
		} catch (error) {
			log.error(`An error ocurred when : ${error}`)
		}
	}
})

function runTiktokParse(msg: Message) {
	const contains = msg.content.match(tikTokRegex)
	if (!contains) return

	const parsed: string[] = []

	for (const match of contains) {
		if (match.includes('vxtiktok.com')) continue
		parsed.push(match.replaceAll(/tiktok\.com/gm, 'vxtiktok.com'))
	}

	msg.write({
		content: `> Sent by ${msg.author.toString()}\n\n${parsed.join('\n')}`
	})

	if (msg.content.split(' ').every(part => tikTokRegex.test(part))) msg.delete()
}

async function runCount(msg: Message) {
	if (!msg.guildId) return

	const content = msg.content
		.toLowerCase()
		.replaceAll(/<a?:[\w\d]+:\d+>/g, '')
		.replaceAll(
			/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/gm,
			''
		)
	if (!content.includes('seal')) return

	let doc = await db.query.guilds.findFirst({
		where: (u, { eq }) => eq(u.id, msg.guildId!)
	})
	if (!doc) {
		doc = (await db.insert(guilds).values({ id: msg.guildId }).returning())![0]
	}
	if (doc.ignoredChannels.includes(msg.channelId)) return

	let uDoc = await db.query.users.findFirst({
		where: (u, { eq }) => eq(u.id, msg.author.id)
	})
	if (!uDoc) {
		uDoc = (await db.insert(users).values({ id: msg.author.id }).returning())![0]
	}
	if (uDoc.ignoreCount) return

	doc.sealCount++
	uDoc.sealCount++

	await Promise.all([
		db.update(guilds).set({ sealCount: doc.sealCount }).where(sql`id = ${doc.id}`),
		db.update(users).set({ sealCount: uDoc.sealCount })
	])

	const emojis = await msg.client.emojis.list(msg.guildId)
	if (emojis.length > 0) await msg.react(emojis[Math.floor(Math.random() * emojis.length)])
}
