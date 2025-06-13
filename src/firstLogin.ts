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
    // Ensure language exists and get its id
    const langRes = await pool.query(
      'SELECT id FROM languages WHERE code = $1',
      [language]
    );
    let languageId: number;
    if (langRes.rowCount > 0) {
      languageId = langRes.rows[0].id;
    } else {
      const insertLang = await pool.query(
        'INSERT INTO languages (code, name) VALUES ($1, $2) RETURNING id',
        [language, language]
      );
      languageId = insertLang.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO user_languages (username, objective, actual_level, language_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username)
         DO UPDATE SET objective = EXCLUDED.objective,
                       language_id = EXCLUDED.language_id`,
      [username, objective, 'beginner', languageId]
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
