import { sql } from 'drizzle-orm'
import {
	Command,
	CommandContext,
	createChannelOption,
	Declare,
	Options
} from 'seyfert'
import { ChannelType } from 'seyfert/lib/types'
import { db } from '../../database'
import { guilds } from '../../database/models/guilds'
import { users } from '../../database/models/users'

const options = {
	channel: createChannelOption({
		required: false,
		description: 'Channel to ignore',
		channel_types: [
			ChannelType.GuildText,
			ChannelType.PublicThread,
			ChannelType.PrivateThread,
			ChannelType.AnnouncementThread,
			ChannelType.GuildAnnouncement
		]
	}),
	user: createChannelOption({
		required: false,
		description: 'User to ignore',
		channel_types: [
			ChannelType.GuildText,
			ChannelType.PublicThread,
			ChannelType.PrivateThread,
			ChannelType.AnnouncementThread,
			ChannelType.GuildAnnouncement
		]
	})
}

@Declare({
	name: 'ignore',
	description: 'Ignore counting on a channel or user',
	defaultMemberPermissions: ['Administrator']
})
@Options(options)
export default class Count extends Command {
	async run(ctx: CommandContext<typeof options>) {
		const { channel, user } = ctx.options
		if (!channel && !user)
			return ctx.write({
				content: 'You need to specify a channel or user to ignore'
			})

		const messages = []

		if (channel) {
			let doc = await db.query.guilds.findFirst({
				where: (u, { eq }) => eq(u.id, ctx.guildId!)
			})
			if (!doc) {
				doc = (await db
					.insert(guilds)
					.values({ id: ctx.guildId! })
					.returning())![0]
			}
			if (doc.ignoredChannels.includes(channel.id))
				return ctx.write({ content: 'This channel is already ignored' })
			doc.ignoredChannels.push(channel.id)

			await db
				.update(guilds)
				.set({ ignoredChannels: doc.ignoredChannels })
				.where(sql`id = ${doc.id}`)

			messages.push(`Ignoring counting on channel: ${channel.toString()}`)
		}

		if (user) {
			let doc = await db.query.users.findFirst({
				where: (u, { eq }) => eq(u.id, user.id)
			})
			if (!doc) {
				doc = (await db
					.insert(users)
					.values({ id: user.id })
					.returning())![0]
			}
			if (doc.ignoreCount)
				return ctx.write({ content: 'This user is already ignored' })

			doc.ignoreCount = true

			await db
				.update(users)
				.set({ ignoreCount: doc.ignoreCount })
				.where(sql`id = ${doc.id}`)

			messages.push(`Ignoring counting on user: ${user.toString()}`)
		}

		ctx.write({ content: messages.join('\n') })
	}
}
