// @ts-nocheck
import { Pool } from 'pg';
import { getPool } from './db';

let pool: Pool | null = null;

export async function saveUserPrefs(
  username: string,
  language: string,
  objective: string
): Promise<boolean> {
  if (!pool) {
    pool = getPool();
  }
  if (!pool) {
    return false;
  }
  try {
    const result = await pool.query(
      `INSERT INTO user_languages (username, language, objective, actual_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username)
         DO UPDATE SET language = EXCLUDED.language,
                       objective = EXCLUDED.objective`,
      [username, language, objective, 'beginner']
    );
    return result.rowCount > 0;
  } catch (err: any) {
    console.error('saveUserPrefs error:', err.message);
    return false;
  }
}

export async function hasUserPrefs(username: string): Promise<boolean> {
  if (!pool) {
    pool = getPool();
  }
  if (!pool) {
    return false;
  }
  try {
    const res = await pool.query(
      'SELECT 1 FROM user_languages WHERE username = $1',
      [username]
    );
    return res.rowCount > 0;
  } catch (err: any) {
    console.error('hasUserPrefs error:', err.message);
    return false;
  }
}
