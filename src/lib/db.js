import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'votes.sqlite'),
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return db;
}
