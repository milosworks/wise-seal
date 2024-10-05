import { configDotenv } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { guilds } from './models/guilds'
import { users } from './models/users'

configDotenv()

export const dbclient = new Client({
	connectionString: process.env.CONN_STRING
})

export const db = drizzle(dbclient, { schema: { users, guilds } })
