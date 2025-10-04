import type { InteractionCreateBodyRequest } from 'seyfert/lib/common'
import { ComponentType, MessageFlags } from 'seyfert/lib/types'

export function createQuickMessage(...msgs: string[]): InteractionCreateBodyRequest {
	return {
		components: [
			{
				type: ComponentType.Container,
				components: msgs.map(x => ({
					type: ComponentType.TextDisplay,
					content: x
				}))
			}
		],
		flags: MessageFlags.IsComponentsV2
	}
}
