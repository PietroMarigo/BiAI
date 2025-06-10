// @ts-nocheck
import net from 'net';
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!pool && process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'users'
    });
  }
  return pool;
}

export function checkDbConnection(): Promise<boolean> {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 5432;

  return new Promise(resolve => {
    const socket = net.connect(port, host);
    socket.setTimeout(1000);
    socket.on('connect', () => {
      console.log('Database connection successful');
      socket.end();
      resolve(true);
    });
    socket.on('error', err => {
      console.log('Database connection failed:', err.message);
      resolve(false);
    });
    socket.on('timeout', () => {
      console.log('Database connection timed out');
      socket.destroy();
      resolve(false);
    });
  });
}
