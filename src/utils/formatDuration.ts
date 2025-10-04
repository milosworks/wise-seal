const msInSecond = 1000
const msInMinute = 60 * msInSecond
const msInHour = 60 * msInMinute

export function formatDuration(milliseconds: number) {
	if (milliseconds === 0) return '0ms'
	if (milliseconds < 0) return 'invalid duration'

	const hours = Math.floor(milliseconds / msInHour)
	const minutes = Math.floor((milliseconds % msInHour) / msInMinute)
	const seconds = Math.floor((milliseconds % msInMinute) / msInSecond)
	const ms = Math.floor(milliseconds % msInSecond)

	const parts: string[] = []

	if (hours > 0) {
		parts.push(`${hours}h`)
		if (minutes > 0) parts.push(`${minutes}m`)
	} else if (minutes > 0) {
		parts.push(`${minutes}m`)
		if (seconds > 0) parts.push(`${seconds}s`)
	} else if (seconds > 0) {
		parts.push(`${seconds}s`)
		if (ms > 0) parts.push(`${ms}ms`)
	} else {
		parts.push(`${ms}ms`)
	}

	return parts.join('')
}
