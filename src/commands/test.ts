import { Command, type CommandContext, Declare, IgnoreCommand } from 'seyfert'
import { type IModal, modalMetadata } from '../components/modals/test'
import { createModalComponents } from '../lib/modal/createModalComponents'

@Declare({
	name: 'test',
	description: 'Testing',
	ignore: IgnoreCommand.Message
})
export default class Test extends Command {
	run(ctx: CommandContext) {
		ctx.interaction!.modal({
			title: 'Test',
			custom_id: 'modal/test',
			components: createModalComponents<IModal>(modalMetadata, { title: 'Hallo default' })
		})
	}
}
