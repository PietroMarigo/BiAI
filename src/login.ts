// @ts-nocheck
import { Pool } from 'pg';
import { getPool } from './db';

let pool: Pool | null = null;

export async function getUserHash(username: string): Promise<string | null> {
  if (!pool) {
    pool = getPool();
  }
  if (!pool) {
    return null;
  }
  try {
    const res = await pool.query(
      'SELECT password_hash FROM users WHERE username = $1',
      [username]
    );
    return res.rows[0]?.password_hash ?? null;
  } catch (err: any) {
    console.error('getUserHash error:', err.message);
    return null;
  }
}
