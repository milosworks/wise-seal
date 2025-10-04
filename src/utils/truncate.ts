export const truncate = (text: string | undefined, max = 100) =>
	text ? (text.length > max ? `${text.slice(0, max - 3)}...` : text) : undefined
