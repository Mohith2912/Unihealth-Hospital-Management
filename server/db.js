import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3307),
  database: process.env.DB_NAME || 'unihealth', user: process.env.DB_USER || 'unihealth',
  password: process.env.DB_PASSWORD, connectionLimit: 10, timezone: 'Z',
  decimalNumbers: true, dateStrings: true,
});
// The driver's timezone option controls JS conversion, not MySQL CURRENT_TIMESTAMP.
// Set every connection's server session to UTC, including schema defaults.
pool.on('connection', connection => {
  connection.query("SET time_zone = '+00:00'");
});

export async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
