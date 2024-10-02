import { configDotenv } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { count } from './models/count'

configDotenv()

export const dbclient = new Client({
	connectionString: process.env.CONN_STRING
})

export const db = drizzle(dbclient, { schema: { count } })
