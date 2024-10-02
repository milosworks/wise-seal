// @ts-nocheck
import { configDotenv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

configDotenv()

export default defineConfig({
	dialect: 'postgresql',
	schema: ['./src/database/models/*.ts'],
	out: './drizzle',
	dbCredentials: {
		url: process.env.CONN_STRING
	}
})
