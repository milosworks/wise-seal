import { Client, Embed, UsingClient } from 'seyfert'
import {
	brightBlack,
	ColorResolvable,
	cyan,
	gray,
	red,
	yellow
} from 'seyfert/lib/common'
import winston from 'winston'
import { constants } from '.'

enum LogLevel {
	debug,
	info,
	warn,
	error
}

const colors: Record<number, ColorResolvable> = {
	[LogLevel.debug]: '#696666',
	[LogLevel.info]: '#00FFFF',
	[LogLevel.warn]: '#F46416',
	[LogLevel.error]: '#EF1B1B'
}

const colorConsole: Record<number, (str: string) => string> = {
	[LogLevel.debug]: gray,
	[LogLevel.info]: cyan,
	[LogLevel.warn]: yellow,
	[LogLevel.error]: red
}

const format = winston.format.printf(({ level, message }) => {
	const ramUsage = process.memoryUsage().heapUsed
	const date = new Date()
	const levelN = LogLevel[level as keyof typeof LogLevel]

	return `[RAM Usage ${brightBlack(
		formatMemoryUsage(ramUsage)
	)}] ${brightBlack(
		`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`
	)} ${colorConsole[levelN](
		`[${level.toUpperCase()}]`
	)} [Wise Seal] > ${message}`
})

export const logger = winston.createLogger({
	level: 'error',
	format: winston.format.combine(format),
	transports: [new winston.transports.Console()],
	levels: Object.fromEntries(
		Object.entries(LogLevel)
			.filter(([_, value]) => typeof value === 'number')
			.map(([key, value]) => [key.toLowerCase(), value])
	) as Record<string, number>
})

global.log = logger

export function sendLog(
	client: UsingClient & Client<boolean>,
	level: string,
	msg: string
) {
	const date = new Date()
	const levelN = LogLevel[level as keyof typeof LogLevel]

	client.messages
		.write(constants.logsChannelId, {
			embeds: [
				new Embed()
					.setTitle('Logging event')
					.setDescription(`\`\`\`\n${msg}\`\`\``)
					.setColor(colors[levelN])
					.addFields(
						{
							name: 'Level',
							value: `\`${level.toUpperCase()}\``,
							inline: true
						},
						{
							name: 'Timestamp',
							value: `\`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\``,
							inline: true
						},
						{
							name: 'RAM Usage',
							value: `\`${formatMemoryUsage(
								process.memoryUsage().heapUsed
							)}\``,
							inline: true
						}
					)
					.setTimestamp()
			]
		})
		.catch(() => {})
}

function formatMemoryUsage(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB']
	let unitIndex = 0

	while (unitIndex < units.length - 1 && bytes >= 1024) {
		bytes /= 1024
		unitIndex++
	}

	return `${bytes.toFixed(unitIndex === 3 ? 3 : 2)} ${units[unitIndex]}`
}
