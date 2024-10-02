import {
	brightBlack,
	ColorResolvable,
	Logger,
	LogLevels
} from 'seyfert/lib/common'

const name = '[Wise Seal]'

export const logLevelColors: { [key in LogLevels]: ColorResolvable } = {
	[LogLevels.Debug]: '#808080',
	[LogLevels.Info]: '#0000FF',
	[LogLevels.Warn]: '#FFA500',
	[LogLevels.Error]: '#FF0000',
	[LogLevels.Fatal]: '#8B0000'
}

export function getLoggerArgs(level: LogLevels, args: unknown[]) {
	// https://github.com/tiramisulabs/seyfert/blob/44c872de71546bfca0820f3eb02f66bcc347a591/src/common/it/logger.ts#L134
	const consoleColor = Logger.colorFunctions.get(level) ?? Logger.noColor
	const memoryData = process.memoryUsage?.()
	const date = new Date()
	const log = [
		brightBlack(formatMemoryUsage(memoryData?.rss ?? 0)),
		brightBlack(
			`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`
		),
		consoleColor(Logger.prefixes.get(level) ?? 'DEBUG'),
		name + ' >',
		...args
	]

	return log
}

export function formatMemoryUsage(bytes: number) {
	const gigaBytes = bytes / 1024 ** 3
	if (gigaBytes >= 1) {
		return `[RAM Usage ${gigaBytes.toFixed(3)} GB]`
	}

	const megaBytes = bytes / 1024 ** 2
	if (megaBytes >= 1) {
		return `[RAM Usage ${megaBytes.toFixed(2)} MB]`
	}

	const kiloBytes = bytes / 1024
	if (kiloBytes >= 1) {
		return `[RAM Usage ${kiloBytes.toFixed(2)} KB]`
	}

	return `[RAM Usage ${bytes.toFixed(2)} B]`
}
