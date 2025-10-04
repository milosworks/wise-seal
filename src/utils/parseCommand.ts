export function parseCommand(inputString: string): string[] {
	const args: string[] = []
	let currentArg = ''
	let quoteChar: '"' | "'" | null = null

	for (const char of inputString) {
		if (quoteChar) {
			// if we are inside a quote, the only special character is the matching quote
			if (char === quoteChar) {
				// Exit quote mode
				quoteChar = null
			} else {
				currentArg += char
			}
		} else {
			// if we are outside a quote, spaces are delimiters and quotes start quote mode
			switch (char) {
				case "'":
				case '"': {
					// enter quote mode
					quoteChar = char
					break
				}
				case ' ':
				// handle other common whitespace
				case '\t': {
					// on whitespace, finalize the current argument
					if (currentArg.length > 0) args.push(currentArg)
					// Reset for the next argument.
					currentArg = ''
					break
				}
				default:
					// accumulate characters for the current argument
					currentArg += char
			}
		}
	}

	// after the loop, push the last argument if it exists
	if (currentArg.length > 0) args.push(currentArg)

	return args
}
