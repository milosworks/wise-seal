import { Command, CommandContext, Declare } from 'seyfert'
import { db } from '../database'
import { guilds } from '../database/models/guilds'
import { users } from '../database/models/users'

@Declare({
	name: 'count',
	description: 'Get the count of times "seal" was mentioned'
})
export default class Count extends Command {
	async run(ctx: CommandContext) {
		let gDoc = await db.query.guilds.findFirst({
			where: (u, { eq }) => eq(u.id, ctx.guildId!)
		})
		if (!gDoc) {
			gDoc = (await db
				.insert(guilds)
				.values({ id: ctx.guildId! })
				.returning())![0]
		}

		let uDoc = await db.query.users.findFirst({
			where: (u, { eq }) => eq(u.id, ctx.author.id)
		})
		if (!uDoc) {
			uDoc = (await db
				.insert(users)
				.values({ id: ctx.author.id })
				.returning())![0]
		}

		ctx.write({
			content: `You have mentioned "seal" **${uDoc.sealCount}** time(s) in this server.\n
			*Seal was mentioned **${gDoc.sealCount}** time(s) in this server.*`
		})
	}
}
