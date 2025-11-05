import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we should use PostgreSQL based on DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
const isPostgres = dbUrl?.startsWith('postgresql://');

let db: any;

if (isPostgres && dbUrl) {
  // Use PostgreSQL in production
  console.log('📂 Using PostgreSQL database');
  const pool = new Pool({ connectionString: dbUrl });
  db = drizzlePg(pool, { schema });
} else {
  // Use SQLite for local development
  // Create .local directory if it doesn't exist
  const localDir = join(__dirname, '../.local');
  if (!existsSync(localDir)) {
    mkdirSync(localDir, { recursive: true });
  }

  // Create local SQLite database file in .local directory
  const dbPath = join(localDir, 'emerald_erp.db');

  console.log(`📂 Using local SQLite database at: ${dbPath}`);

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  db = drizzleSqlite(sqlite, { schema });
}

export { db };
