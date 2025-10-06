import { ModalCommand, type ModalContext } from 'seyfert'
import type { TextInputStyle } from 'seyfert/lib/types'
import typia, { type tags } from 'typia'
import { parseModalSubmission } from '../../lib/modal/parseModalSubmission'
import type { modal } from '../../lib/modal/types'
import type { t } from '../../lib/types'

export interface IModal {
	title: string &
		t.Label<'Title'> &
		t.Placeholder<'Your title...'> &
		modal.Style<TextInputStyle.Short> &
		tags.MinLength<4>
	description?: string &
		t.Label<'Description'> &
		t.Placeholder<'Add description...'> &
		modal.Style<TextInputStyle.Paragraph> &
		tags.MinLength<10> &
		tags.Default<'ratio + vlang better + ur mom'>
}

export const modalMetadata = typia.reflect.metadata<[IModal]>()

export default class Modal extends ModalCommand {
	customId = 'modal/test'

	run(ctx: ModalContext) {
		const opts = parseModalSubmission(ctx.interaction.components, modalMetadata, typia.createAssert<IModal>())

		console.log(opts)

		ctx.editOrReply({ content: 'test' })
	}
}
