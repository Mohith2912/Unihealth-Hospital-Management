// One-time setup for the new project-only local MySQL instance.
import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { writeFile, access } from 'node:fs/promises';
try { await access('.env'); throw new Error('.env already exists; refusing to replace credentials.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const dbPassword = randomBytes(32).toString('hex'), rootPassword = randomBytes(32).toString('hex');
const db = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root' });
try {
  await db.query('CREATE DATABASE unihealth CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  await db.query('CREATE DATABASE unihealth_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  await db.query("CREATE USER 'unihealth'@'127.0.0.1' IDENTIFIED BY ?", [dbPassword]);
  await db.query("GRANT ALL ON unihealth.* TO 'unihealth'@'127.0.0.1'");
  await db.query("GRANT ALL ON unihealth_test.* TO 'unihealth'@'127.0.0.1'");
  await db.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [rootPassword]);
  await writeFile('.env', `PORT=3000\nAPP_ORIGIN=http://localhost:3000\nNODE_ENV=development\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_NAME=unihealth\nDB_USER=unihealth\nDB_PASSWORD=${dbPassword}\nMYSQL_ROOT_PASSWORD=${rootPassword}\nSMTP_HOST=\nSMTP_PORT=587\nSMTP_SECURE=false\nSMTP_USER=\nSMTP_PASSWORD=\nSMTP_FROM=\n`);
  console.log('Created empty unihealth and isolated test databases. Random credentials saved to ignored .env.');
} finally { await db.end(); }
