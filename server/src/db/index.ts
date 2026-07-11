import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

// Use the Neon HTTP (serverless) driver — this is the correct driver for
// Vercel serverless functions. The standard pg.Pool requires a persistent
// TCP connection which cannot be maintained between Vercel invocations,
// causing connection failures and timeouts in production.
//
// @neondatabase/serverless uses HTTP under the hood, making each query
// a stateless HTTPS request — perfect for serverless environments.
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
