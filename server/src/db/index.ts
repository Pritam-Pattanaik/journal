import dns from 'dns';
// Force IPv4 resolution — fixes Node 17+ IPv6 routing failures to Neon
// serverless Postgres on networks with broken IPv6.
dns.setDefaultResultOrder('ipv4first');

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

// Use the Node.js `pg` driver via Prisma's driver adapter.
// This makes Prisma connect through Node's TCP stack (which obeys
// dns.setDefaultResultOrder) instead of its Rust query engine binary
// (which does its own DNS resolution and picks up broken IPv6 on Windows).
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
