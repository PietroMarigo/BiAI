// @ts-nocheck
import { Pool } from 'pg';
import { getPool } from './db';

// Types for the quiz structure returned by n8n
export interface MultipleChoiceQuestion {
  id: number;
  type: 'multiple_choice';
  text: string;
  options: string[];
  answer: string;
  topic: string;
  difficulty: string;
}

export interface FillInTheBlankQuestion {
  id: number;
  type: 'fill_in_the_blank';
  text: string;
  answer: string;
  topic: string;
  difficulty: string;
}

export interface ShortAnswerQuestion {
  id: number;
  type: 'short_answer';
  text: string;
  answer_keywords: string[];
  topic: string;
  difficulty: string;
}

export interface MatchingItem {
  french: string;
  english: string;
}

export interface MatchingQuestion {
  id: number;
  type: 'matching';
  text: string;
  items: MatchingItem[];
  topic: string;
  difficulty: string;
}

export type Question =
  | MultipleChoiceQuestion
  | FillInTheBlankQuestion
  | ShortAnswerQuestion
  | MatchingQuestion;

export interface Quiz {
  questions: Question[];
}

// Raw payload shape from n8n
type RawN8nOutput = Array<{ output: string }>;

/**
 * Cleans the output coming from the n8n node, stripping markdown fences
 * and parsing the inner JSON.
 */
export function cleanN8nOutput(raw: RawN8nOutput): Quiz {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Invalid input: expected a non-empty array');
  }

  let jsonText = raw[0].output;
  const fencedMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    jsonText = fencedMatch[1];
  }
  jsonText = jsonText.trim();

  const attempts = [
    jsonText,
    jsonText.replace(/^['"]|['"]$/g, ''),
    (() => {
      try {
        return JSON.parse(jsonText);
      } catch {
        return '';
      }
    })()
  ];

  for (const text of attempts) {
    if (!text) continue;
    try {
      const parsed = typeof text === 'string' ? JSON.parse(text) : text;
      if (parsed && Array.isArray((parsed as any).questions)) {
        return parsed as Quiz;
      }
    } catch {
      // try next
    }
  }
  console.error('Failed to parse n8n output:\n', jsonText);
  throw new Error('Could not clean/parse n8n output JSON');
}

const quizzes: Map<string, Quiz> = new Map();

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
    const res = await p.query(
      `SELECT l.code AS language, ul.objective
       FROM user_languages ul
       JOIN languages l ON ul.language_id = l.id
       WHERE ul.username = $1`,
      [username]
    );
    if (res.rowCount > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.error('getPrefs error:', err.message);
  }
  return null;
}

export async function startEvaluation(username: string): Promise<Question[] | null> {
  const prefs = await getPrefs(username);
  if (!prefs || !process.env.N8N_WEBHOOK_URL) {
    return null;
  }
  try {
    const payload = {
      username,
      language: prefs.language,
      objective: prefs.objective
    };
    console.log('Posting evaluation start payload:', payload);

    const url = process.env.N8N_WEBHOOK_URL.includes('?')
      ? `${process.env.N8N_WEBHOOK_URL}&wait=1`
      : `${process.env.N8N_WEBHOOK_URL}?wait=1`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const quiz = cleanN8nOutput(raw);
    quizzes.set(username, quiz);
    const questionsForUser = quiz.questions.map(q => {
      const { answer, answer_keywords, ...rest } = q as any;
      return rest;
    });
    return questionsForUser;
  } catch (err) {
    console.error('startEvaluation error:', err.message);
    return null;
  }
}

export interface EvaluationResult {
  level: string;
  suggestion?: string;
}

export async function finishEvaluation(
  username: string,
  answers: string[]
): Promise<EvaluationResult | null> {
  const quiz = quizzes.get(username);
  quizzes.delete(username);
  if (!quiz || !process.env.N8N_GRADE_URL) return null;
  try {
    const res = await fetch(process.env.N8N_GRADE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, quiz, answers })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const level = data.level;
    const suggestion = data.suggestion || data.recommendation;
    if (!level) return null;
    const p = await ensurePool();
    if (p) {
      await p.query(
        'UPDATE user_languages SET actual_level = $1 WHERE username = $2',
        [level, username]
      );
    }
    return { level, suggestion };
  } catch (err) {
    console.error('finishEvaluation error:', err.message);
    return null;
  }
}
