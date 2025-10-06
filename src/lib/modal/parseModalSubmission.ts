import type { ModalSubmitInteraction } from 'seyfert'
import type { IMetadataApplication } from 'typia/lib/schemas/metadata/IMetadataApplication'

/**
 * Extracts a mapping from a component's customId to its property name from typia metadata
 */
function buildCustomIdMap(metadata: IMetadataApplication): Record<string, string> {
	return metadata.components.objects[0]!.properties.reduce(
		(acc, { key, value }) => {
			const name = key.constants[0]!.values[0]!.value as string
			const customId = value.atomics[0]!.tags.flat().find(tag => tag.kind === 'modal-customid')?.value

			if (customId && name) {
				acc[customId as string] = name
			}
			return acc
		},
		{} as Record<string, string>
	)
}

/**
 * Parses a modal submission's components into a strongly-typed object
 * @param components The components from the modal interaction
 * @param metadata The typia application metadata for the target type
 * @param assertFunc The typia assertion function to validate and cast the result
 * @returns A validated object of type T
 */
export function parseModalSubmission<T>(
	components: ModalSubmitInteraction['components'],
	metadata: IMetadataApplication,
	assertFunc: (input: unknown) => T
): T {
	const idToNameMap = buildCustomIdMap(metadata)

	const rawObject = components
		.flatMap(row => row.components)
		.reduce(
			(accumulator, component) => {
				const key = idToNameMap[component.customId] ?? component.customId
				accumulator[key] = component.value
				return accumulator
			},
			{} as Record<string, string>
		)

	return assertFunc(rawObject)
}
