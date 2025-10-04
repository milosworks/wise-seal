import { PassThrough } from 'node:stream'
import {
	AttachmentBuilder,
	Command,
	type CommandContext,
	createNumberOption,
	createStringOption,
	Declare,
	IgnoreCommand,
	type MessageStructure,
	Options,
	type SeyfertChoice
} from 'seyfert'
import YTDlpWrap from 'yt-dlp-wrap'
import { createQuickMessage } from '../utils/createQuickMessage'
import { parseCommand } from '../utils/parseCommand'

const ytdlp = new YTDlpWrap('yt-dlp')

// Discord Video Codecs: VP8, VP9, H.264 and H.265 (HEVC)
// Discord Audio Codecs: Opus
// Container formats: MP4, MOV, WEBM

enum Preset {
	BestQuality,
	Discord,
	ExtractMP3,
	AudioHQ
}

const getPresetName = (p: Preset): string => {
	switch (p) {
		case Preset.BestQuality:
			return 'Absolute Best Quality'
		case Preset.Discord:
			return 'Best Quality (Discord-Optimized)'
		case Preset.ExtractMP3:
			return 'Extract Audio (MP3)'
		case Preset.AudioHQ:
			return 'Best Audio (No Convert)'
		default:
			return p
	}
}

const presetCommands: Record<Preset, (sizelimit: number) => string> = {
	[Preset.BestQuality]: size =>
		`-f bv[filesize_approx<${size / 2}M]*+ba[filesize_approx<${size / 2}M]/b[filesize_approx<${size}M]`,
	[Preset.Discord]: size =>
		`-S vcodec:vp9:hevc:avc -f bv[filesize_approx<${size / 2}M]+ba[filesize_approx<${size / 2}M]/best[filesize_approx<${size}M]`,
	[Preset.ExtractMP3]: () => '',
	[Preset.AudioHQ]: () => ''
}

const forbiddenFlags = new RegExp(['--exec', '-P', '--postprocessor-args', '--ppa'].join('|'), 'g')

const options = {
	url: createStringOption({
		description: 'The URL of the video or audio to download.',
		required: true
	}),
	preset: createNumberOption({
		description: 'Select a pre-configured format. (Default: Best Quality (Discord-Optimized))',
		choices: Object.values(Preset)
			.filter(x => typeof x === 'number')
			.map(x => ({ name: getPresetName(x), value: x })) satisfies SeyfertChoice<Preset>[],
		required: false
	}),
	'custom-options': createStringOption({
		description: 'Supply your own yt-dlp flags. These will be applied after any selected preset.',
		required: false
	})
}

@Declare({
	name: 'download',
	description: 'Download a video or audio via yt-dlp',
	contexts: ['BotDM', 'Guild', 'PrivateChannel'],
	integrationTypes: ['GuildInstall', 'UserInstall'],
	ignore: IgnoreCommand.Message
})
@Options(options)
export default class Download extends Command {
	private static buildArguments(url: string, maxSizeMb: number, preset?: Preset, customOptions?: string) {
		const presetArgs = preset !== undefined ? parseCommand(presetCommands[preset](maxSizeMb)) : []
		const customArgs = customOptions ? parseCommand(customOptions.replaceAll(forbiddenFlags, '')) : []
		const args =
			preset || customOptions
				? [...presetArgs, ...customArgs]
				: [...parseCommand(presetCommands[Preset.Discord](maxSizeMb))]
		// const formatFlagIndex = args.findLastIndex(arg => arg === '-f' || arg === '--format')

		// if (formatFlagIndex !== -1 && formatFlagIndex + 1 < args.length)
		// 	args[formatFlagIndex + 1] = `(${args[formatFlagIndex + 1]})[filesize<=${maxSizeMb}M]`

		return [url.replaceAll(forbiddenFlags, ''), ...args]
	}

	async run(ctx: CommandContext<typeof options>) {
		return ctx.editOrReply({ content: 'Sorry, disabled for now :3' })

		await ctx.deferReply(false, false)

		const channel = await ctx.channel()
		if (!channel.isTextGuild()) return

		const { url, preset, 'custom-options': customOptions } = ctx.options
		const fileSizeLimit = 400
		// ctx.interaction!.attachmentSizeLimit / 1024 * 1024
		const args = Download.buildArguments(url, fileSizeLimit, preset, customOptions)
		const stream = ytdlp.execStream(args, {})
		const eventMessages: string[] = []
		const messages: MessageStructure[] = []
		const header = ['# Output', `[Original URL](${url})`, `-# \`${args.join(' ')}\``]
		const headerLength = header.join('\n').length

		await ctx.editOrReply(createQuickMessage(...header))

		stream.ytDlpProcess?.stderr.on('data', async data => {
			if (data.toString().startsWith('[')) return

			eventMessages.push(data.toString())

			const chunks = groupMessages(eventMessages, headerLength)
			for (const [i, chunk] of chunks.entries()) {
				if (i === 0)
					return await ctx.editOrReply(createQuickMessage(...header, `\`\`\`${chunk.join('\n')}\`\`\``))

				const msg = messages[i - 1]

				if (!msg) {
					messages.push(await channel.messages.write(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``)))
					continue
				}

				await msg.edit(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``))
			}
		})

		stream.on('ytDlpEvent', async (eventType, data) => {
			if (eventType === 'download') return

			eventMessages.push(`[${eventType}] ${data}`)

			const chunks = groupMessages(eventMessages, headerLength)
			for (const [i, chunk] of chunks.entries()) {
				if (i === 0)
					return await ctx.editOrReply(createQuickMessage(...header, `\`\`\`${chunk.join('\n')}\`\`\``))

				const msg = messages[i - 1]

				if (!msg) {
					messages.push(await channel.messages.write(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``)))
					continue
				}

				await msg.edit(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``))
			}
		})

		stream.on('error', err => {
			throw err
		})

		const buffer: Buffer[] = []
		const passThrough = new PassThrough()
		stream.pipe(passThrough)

		passThrough.on('data', chunk => {
			buffer.push(chunk)
		})

		passThrough.on('error', error => {
			throw error
		})

		passThrough.on('end', async () => {
			const chunks = groupMessages(eventMessages, headerLength)
			for (const [i, chunk] of chunks.entries()) {
				if (i === 0)
					return await ctx.editOrReply(createQuickMessage(...header, `\`\`\`${chunk.join('\n')}\`\`\``))

				const msg = messages[i - 1]

				if (!msg) {
					messages.push(await channel.messages.write(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``)))
					continue
				}

				await msg.edit(createQuickMessage(`\`\`\`${chunk.join('\n')}\`\`\``))
			}
			const file = Buffer.concat(buffer)
			if (!file.length) return
			if ((file.byteLength / 1024) * 1024 > fileSizeLimit)
				return channel.messages.write({ content: 'File size is bigger than limit.' })

			const attachment = new AttachmentBuilder().setFile('buffer', file).setName('video.mp4')

			await channel.messages.write({ files: [attachment] })
		})
	}
}

function groupMessages(messages: string[], initialReservedSpace = 0, maxLength = 4000): string[][] {
	const result: string[][] = []
	const joiner = '\n'
	const wrapperLength = 6 // "```" + "```"

	// The content limit for all chunks *except* the first one.
	const baseContentLimit = maxLength - wrapperLength
	// The reduced content limit specifically for the first chunk.
	const firstChunkContentLimit = baseContentLimit - initialReservedSpace

	let currentGroup: string[] = []
	let currentContentLength = 0

	for (const message of messages) {
		// A message is "oversized" if it can't even fit in a standard chunk by itself.
		if (message.length > baseContentLimit) {
			if (currentGroup.length > 0) result.push(currentGroup)

			let remaining = message
			while (remaining.length > baseContentLimit) {
				const part = remaining.substring(0, baseContentLimit)
				result.push([part])
				remaining = remaining.substring(baseContentLimit)
			}
			currentGroup = remaining.length > 0 ? [remaining] : []
			currentContentLength = remaining.length
			continue
		}

		// Determine which limit applies to the current packing operation.
		// If result is empty, we are still building the first chunk.
		const activeContentLimit = result.length === 0 ? firstChunkContentLimit : baseContentLimit

		const lengthToAdd = (currentGroup.length > 0 ? joiner.length : 0) + message.length

		if (currentContentLength + lengthToAdd > activeContentLimit) {
			result.push(currentGroup)
			currentGroup = [message]
			currentContentLength = message.length
		} else {
			currentGroup.push(message)
			currentContentLength += lengthToAdd
		}
	}

	if (currentGroup.length > 0) {
		result.push(currentGroup)
	}

	return result
}
