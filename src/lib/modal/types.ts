import type { TextInputStyle } from 'seyfert/lib/types'
import type { tags } from 'typia'

export namespace modal {
	export type CustomId<Value> = tags.TagBase<{
		kind: 'modal-customid'
		target: 'string'
		value: Value
		exclusive: true
	}>

	export type Style<Value extends TextInputStyle> = tags.TagBase<{
		kind: 'modal-style'
		target: 'string'
		value: Value
		exclusive: true
	}>
}
