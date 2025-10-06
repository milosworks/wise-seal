import type { tags } from 'typia'

export namespace t {
	export type Label<Value> = tags.TagBase<{
		kind: 'label'
		target: 'string' | 'number' | 'boolean'
		value: Value
		exclusive: true
	}>

	export type Placeholder<Value> = tags.TagBase<{
		kind: 'placeholder'
		target: 'string' | 'number' | 'boolean'
		value: Value
		exclusive: true
	}>
}

// Future panel functionality
// export type Type<Value extends 'display' | 'select' | 'multi'> = tags.TagBase<{
// 	kind: 'panel-type'
// 	target: 'string'
// 	value: Value
// 	exclusive: true
// }>
