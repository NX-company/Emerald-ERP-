import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export const db = drizzle(sqlite, { schema });
