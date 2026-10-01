import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { pool } from './db.js';
export async function migrate() {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').filter(s => s.trim())) await pool.query(statement);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await migrate(); console.log('MySQL schema is ready. No sample records were inserted.'); }
  finally { await pool.end(); }
}
