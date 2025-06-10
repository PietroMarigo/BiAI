// @ts-nocheck
import { Pool } from 'pg';

let pool: Pool | null = null;
if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME) {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'users'
  });
}

export async function createUser(
  username: string,
  passwordHash: string,
  name: string,
  surname: string,
  email: string,
  telegramId?: string
): Promise<'ok' | 'exists' | 'error'> {
  if (!pool) {
    return 'ok';
  }
  try {
    await pool.query(
      'INSERT INTO users (username, password_hash, name, surname, email, telegram_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, passwordHash, name, surname, email, telegramId ?? null]
    );
    return 'ok';
  } catch (err: any) {
    if (err.code === '23505') {
      return 'exists';
    }
    console.error('createUser error:', err.message);
    return 'error';
  }
}
