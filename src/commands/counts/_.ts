import { AutoLoad, Command, Declare, IgnoreCommand } from 'seyfert'

@Declare({
	name: 'counts',
	description: 'Commands about the counts in the guild',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	ignore: IgnoreCommand.Message
})
@AutoLoad()
export default class Counts extends Command {}
