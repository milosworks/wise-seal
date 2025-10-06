import type { ModalSubmitInteraction } from 'seyfert'
import type { IValidation } from 'typia'
import type { IMetadataApplication } from 'typia/lib/schemas/metadata/IMetadataApplication'

export function parseModalSubmission<T>(
	components: ModalSubmitInteraction['components'],
	metadata: IMetadataApplication,
	validator: (input: unknown) => IValidation<T>
): IValidation<T>

export function parseModalSubmission<T>(
	components: ModalSubmitInteraction['components'],
	metadata: IMetadataApplication,
	asserter: (input: unknown) => T
): T

/**
 * Parses a modal submission's components into a strongly-typed object
 * Transforms primitive string values into their target types
 * @param components The components from the modal interaction
 * @param metadata The typia application metadata for the target type
 * @param assertFunc The typia assertion function to validate and cast the result
 * @returns A validated object of type T
 */
export function parseModalSubmission<T>(
	components: ModalSubmitInteraction['components'],
	metadata: IMetadataApplication,
	func: ((input: unknown) => T) | ((input: unknown) => IValidation<T>)
): T {
	const mainObject = metadata.components.objects[0]
	if (!mainObject) throw new Error('Metadata does not contain any object definitions.')

	const { idToNameMap, propertyTypes } = mainObject.properties.reduce(
		(acc, prop) => {
			const name = prop.key.constants[0]?.values[0]?.value as string
			if (!name) return acc

			const customId = prop.value.atomics[0]?.tags.flat().find(tag => tag.kind === 'modal-customid')
				?.value as string
			const type = prop.value.atomics[0]?.type ?? 'string'

			if (customId) {
				acc.idToNameMap[customId] = name
			}
			acc.propertyTypes.set(name, type)
			return acc
		},
		{
			idToNameMap: {} as Record<string, string>,
			propertyTypes: new Map<string, string>()
		}
	)

	const transformedObject = components
		.flatMap(row => row.components)
		.reduce(
			(acc, { customId, value }) => {
				const key = idToNameMap[customId] ?? customId
				const targetType = propertyTypes.get(key)

				switch (targetType) {
					case 'number':
					case 'integer': {
						if (value === '') acc[key] = undefined

						const num = Number(value)
						if (Number.isNaN(num))
							throw new Error(`Invalid input for '${key}'. Expected a number but received "${value}".`)

						acc[key] = num
						break
					}
					case 'boolean': {
						acc[key] = value === '' ? undefined : value.toLowerCase() === 'true'
						break
					}
					default:
						acc[key] = value
				}
				return acc
			},
			{} as Record<string, unknown>
		)

	// biome-ignore lint/suspicious/noExplicitAny: typescript gets angy bc of overloads
	return func(transformedObject) as any
}
