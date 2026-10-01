import { app } from './app.js';
import { pool } from './db.js';
await pool.query('SELECT 1 FROM hospitals LIMIT 1');
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '127.0.0.1', () => console.log(`UniHealth ready at http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
