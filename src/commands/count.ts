import { Command, CommandContext, Declare } from 'seyfert'
import { db } from '../database'
import { count } from '../database/models/count'

@Declare({
	name: 'count',
	description: 'Get the count of times "seal" was mentioned'
})
export default class Count extends Command {
	async run(ctx: CommandContext) {
		let doc = await db.query.count.findFirst()
		if (!doc) {
			doc = (await db.insert(count).values({}).returning())![0]
		}

		ctx.write({
			content: `Seal was mentioned **${doc.times}** times`
		})
	}
}
