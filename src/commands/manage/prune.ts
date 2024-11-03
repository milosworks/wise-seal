import {
	AllGuildTextableChannels,
	Command,
	CommandContext,
	createChannelOption,
	createIntegerOption,
	createUserOption,
	Declare,
	Options
} from 'seyfert'
import { ChannelType } from 'seyfert/lib/types'

const options = {
	quantity: createIntegerOption({
		required: true,
		description: 'Quantity of messages to delete'
	}),
	user: createUserOption({
		required: false,
		description: 'User to delete messages from'
	}),
	channel: createChannelOption({
		required: false,
		description: 'Channel to delete messages from',
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
	name: 'prune',
	description: 'Delete messages using a filter'
})
@Options(options)
export default class Prune extends Command {
	async run(ctx: CommandContext<typeof options>) {
		ctx.deferReply(true)

		const { user, quantity, channel: inputChannel } = ctx.options
		const channel = (inputChannel || ctx.channel()) as AllGuildTextableChannels

		let lastId: string | undefined
		let deleted = 0
		let errored = false

		await chunks(quantity, 100, async limit => {
			try {
				const messages = await ctx.client.channels.fetchMessages(channel.id, {
					limit,
					...(lastId ? { before: lastId } : {})
				})
				if (!messages.length) return [0, false]
				if (messages.length === 1) {
					await messages[0].delete('Purging messages')
					deleted++
					return [1, false]
				}

				lastId = messages[messages.length - 1].id

				const ids = messages.filter(msg => (user ? msg.author.id === user.id : true)).map(msg => msg.id)
				if (!ids.length) return [0, true]
				if (ids.length === 1) {
					await ctx.client.messages.delete(ids[0], channel.id, 'Purging messages')
					deleted++
					return [1, true]
				}

				await ctx.client.messages.purge(ids, channel.id, 'Purging messages')
				deleted += ids.length

				return [ids.length, true]
			} catch (error) {
				errored = true
				await ctx.editResponse({
					content: `An error ocurred: \`\`\`\n${error}\`\`\``
				})

				return [0, false]
			}
		})
		if (errored) return

		await ctx.editResponse({
			content: `Deleted **${deleted}** messages${
				inputChannel ? ` in ${channel.toString()}` : ''
			}${user ? ` from ${user.toString()}` : ''}`
		})
		setTimeout(() => {
			ctx.deleteResponse()
		}, 3000)
	}
}

async function chunks(quantity: number, limit: number, fn: (chunk: number) => Promise<[number, boolean]>) {
	let remainingQuantity = quantity

	while (remainingQuantity > 0) {
		const chunk = Math.min(limit, remainingQuantity)
		const [remains, shouldContinue] = await fn(chunk)
		if (!shouldContinue) break

		remainingQuantity -= remains
	}
}
