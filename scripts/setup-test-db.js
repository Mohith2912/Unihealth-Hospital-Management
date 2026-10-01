import mysql from 'mysql2/promise';
const user = process.env.DB_USER || 'unihealth';
if (!/^[a-zA-Z0-9_]+$/.test(user)) throw new Error('DB_USER must use letters, numbers, and underscores.');
const connection = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3307), user: 'root', password: process.env.MYSQL_ROOT_PASSWORD });
try {
  await connection.query('CREATE DATABASE IF NOT EXISTS unihealth_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
  const [accounts] = await connection.execute('SELECT Host FROM mysql.user WHERE User=?',[user]);
  if (!accounts.length) throw new Error('Create the configured application database user first.');
  for (const { Host } of accounts) await connection.query(`GRANT ALL ON unihealth_test.* TO ${connection.escape(user)}@${connection.escape(Host)}`);
  console.log('Isolated unihealth_test database is ready.');
} finally { await connection.end(); }
