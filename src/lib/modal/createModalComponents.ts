import { type APIActionRowComponent, type APIModalActionRowComponent, ComponentType } from 'seyfert/lib/types'
import type { IMetadataApplication } from 'typia/lib/schemas/metadata/IMetadataApplication'
import type { IMetadataProperty } from 'typia/lib/schemas/metadata/IMetadataProperty'

/**
 * Parses typia metadata tags for a single property into a key-value object
 */
function parseComponentTags(property: IMetadataProperty) {
	const tags = property.value.atomics[0]?.tags.flat() ?? []

	return tags.reduce(
		(acc, tag) => {
			acc[tag.kind] = tag.value
			return acc
		},
		// biome-ignore lint/suspicious/noExplicitAny: i no wanna do it in a good way
		{} as Record<string, any | undefined>
	)
}

/**
 * Creates an array of Discord modal components based on typia metadata.
 * @template T The type being used to generate the modal structure.
 * @param metadata The typia application metadata for the target type.
 * @param data Optional data to pre-fill the modal's input fields.
 * @returns An array of APIActionRowComponents ready to be used in a modal.
 */
export function createModalComponents<T>(
	metadata: IMetadataApplication,
	data?: Partial<T>
): APIActionRowComponent<APIModalActionRowComponent>[] {
	const mainObject = metadata.components.objects[0]
	if (!mainObject) throw new Error('Metadata does not contain any object definitions to create a modal.')

	return mainObject.properties.map((property): APIActionRowComponent<APIModalActionRowComponent> => {
		const propertyName = property.key.constants[0]?.values[0]?.value as string
		if (!propertyName) throw new Error('Could not determine property name from metadata.')

		const tags = parseComponentTags(property)
		if (!tags['modal-style']) throw new Error(`Property "${propertyName}" needs a 'modal.Style' tag.`)

		if (!tags.label) throw new Error(`Property "${propertyName}" needs a 'label' tag.`)

		const defaultValue = data && ((data as Record<string, string>)[propertyName] ?? tags.default)

		const textInput: APIModalActionRowComponent = {
			type: ComponentType.TextInput,
			custom_id: tags['modal-customid'] ?? propertyName,
			label: tags.label,
			style: tags['modal-style'],
			placeholder: tags.placeholder,
			max_length: tags.maxLength,
			min_length: tags.minLength,
			required: !property.value.optional,
			value: defaultValue
		}

		return {
			type: ComponentType.ActionRow,
			components: [textInput]
		}
	})
}
