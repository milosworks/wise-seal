import { ModalCommand, type ModalContext } from 'seyfert'
import { MessageFlags, type TextInputStyle } from 'seyfert/lib/types'
import typia, { type tags } from 'typia'
import { parseModalSubmission } from '../../lib/modal/parseModalSubmission'
import type { modal } from '../../lib/modal/types'
import type { t } from '../../lib/types'
import { createQuickMessage } from '../../utils/createQuickMessage'

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
	num: number & t.Label<'Version'> & modal.Style<TextInputStyle.Short> & tags.Minimum<10> & tags.Maximum<20>
}

export const modalMetadata = typia.reflect.metadata<[IModal]>()

const modalValidate = typia.createValidateEquals<IModal>()
// const modalAssert = typia.createAssert<IModal>()

export default class Modal extends ModalCommand {
	customId = 'modal/test'

	run(ctx: ModalContext) {
		const opts = parseModalSubmission(ctx.interaction.components, modalMetadata, modalValidate)

		console.log(opts)

		ctx.editOrReply({ content: 'test' })
	}

	onRunError(ctx: ModalContext, error: unknown) {
		ctx.editOrReply({
			...createQuickMessage('# Error', `An unknown error has ocurred: \`\`\`\n${error}\`\`\``),
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
		})
	}
}
