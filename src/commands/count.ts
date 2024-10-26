import { Command, type CommandContext, createUserOption, Declare, Options } from 'seyfert'
import { db } from '../database'
import { guilds } from '../database/models/guilds'
import { users } from '../database/models/users'

const options = {
	user: createUserOption({
		required: false,
		description: 'User to get count'
	})
}

@Declare({
	name: 'count',
	description: 'Get the count of times "seal" was mentioned'
})
@Options(options)
export default class Count extends Command {
	async run(ctx: CommandContext<typeof options>) {
		const user = ctx.options.user || ctx.author

		let gDoc = await db.query.guilds.findFirst({
			where: (u, { eq }) => eq(u.id, ctx.guildId!)
		})
		if (!gDoc) {
			gDoc = (await db.insert(guilds).values({ id: ctx.guildId! }).returning())![0]
		}

		let uDoc = await db.query.users.findFirst({
			where: (u, { eq }) => eq(u.id, user.id)
		})
		if (!uDoc) {
			uDoc = (await db.insert(users).values({ id: user.id }).returning())![0]
		}

		ctx.write({
			content: `${ctx.options.user ? `${user.toString()} has` : 'You have'} mentioned "seal" **${uDoc.sealCount}** time(s) in this server.\n
			*Seal was mentioned **${gDoc.sealCount}** time(s) in this server.*`
		})
	}
}
