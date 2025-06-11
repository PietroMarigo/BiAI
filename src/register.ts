// @ts-nocheck
import { Pool } from 'pg';
import { getPool } from './db';

let pool: Pool | null = null;

export async function createUser(
  username: string,
  passwordHash: string,
  name: string,
  surname: string,
  email: string,
  telegramId?: string
): Promise<'ok' | 'exists' | 'error'> {
  if (!pool) {
    pool = getPool();
  }
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

