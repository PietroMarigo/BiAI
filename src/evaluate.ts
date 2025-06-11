// @ts-nocheck
import { Pool } from 'pg';
import { getPool } from './db';

let pool: Pool | null = null;

async function ensurePool() {
  if (!pool) {
    pool = getPool();
  }
  return pool;
}

export async function getPrefs(username: string) {
  const p = await ensurePool();
  if (!p) return null;
  try {
    const res = await p.query('SELECT language, objective FROM user_languages WHERE username = $1', [username]);
    if (res.rowCount > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.error('getPrefs error:', err.message);
  }
  return null;
}

export async function startEvaluation(username: string): Promise<string[] | null> {
  const prefs = await getPrefs(username);
  if (!prefs || !process.env.N8N_WEBHOOK_URL) {
    return null;
  }
  try {
    const res = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: prefs.language, objective: prefs.objective })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.questions) ? data.questions : null;
  } catch (err) {
    console.error('startEvaluation error:', err.message);
    return null;
  }
}

export async function finishEvaluation(username: string, answers: string[]): Promise<boolean> {
  if (!process.env.N8N_WEBHOOK_URL) return false;
  try {
    const res = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, answers })
    });
    if (!res.ok) return false;
    const data = await res.json();
    const level = data.level;
    if (!level) return false;
    const p = await ensurePool();
    if (!p) return false;
    await p.query('UPDATE user_languages SET actual_level = $1 WHERE username = $2', [level, username]);
    return true;
  } catch (err) {
    console.error('finishEvaluation error:', err.message);
    return false;
  }
}
