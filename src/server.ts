// @ts-nocheck
import express from 'express';
import path from 'path';
import { loadCredentials } from './credentials';
import { fetchChatMessage } from './openrouter';
import { checkDbConnection } from './db';
import bcrypt from 'bcryptjs';
import { createUser } from './register';
import { getUserHash } from './login';
import { saveUserPrefs, hasUserPrefs } from './firstLogin';
import { startEvaluation, finishEvaluation } from './evaluate';

function parseCookies(req: express.Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  header.split(';').forEach(part => {
    const [k, v] = part.trim().split('=');
    if (k && v) cookies[k] = decodeURIComponent(v);
  });
  return cookies;
}

export function startServer(port: number) {
  loadCredentials();
  checkDbConnection();

  const app = express();
  app.use(express.json());
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  // serve the login and registration pages
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });

  app.get('/register', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
  });

  const users: Record<string, string> = {};

  app.post('/register', async (req, res) => {
    const { username, password, name, surname, email, telegram_id } = req.body || {};
    if (!username || !password || !name || !surname || !email) {
      res.status(400).send('Missing required fields');
      return;
    }
    if (users[username]) {
      res.status(409).send('User exists');
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await createUser(username, hash, name, surname, email, telegram_id);
    if (result === 'exists') {
      res.status(409).send('User exists');
      return;
    }
    if (result === 'error') {
      res.status(500).send('Database error');
      return;
    }
    if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_NAME) {
      users[username] = hash;
    }
    res.status(201).send('Registered');
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    let hash: string | null | undefined;
    if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME) {
      hash = await getUserHash(username);
    } else {
      hash = users[username];
    }
    if (hash && await bcrypt.compare(password, hash)) {
      res.cookie('user', encodeURIComponent(username), { httpOnly: true });
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  });

  app.get('/homepage', async (req, res) => {
    const cookies = parseCookies(req);
    const username = cookies['user'];
    if (!username) {
      res.redirect('/login');
      return;
    }
    if (!(await hasUserPrefs(username))) {
      res.redirect('/first-login');
      return;
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
  });

  app.get('/first-login', (req, res) => {
    const cookies = parseCookies(req);
    if (!cookies['user']) {
      res.redirect('/login');
      return;
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
  });

  app.post('/first-login', async (req, res) => {
    const cookies = parseCookies(req);
    const username = cookies['user'];
    const { language, objective } = req.body || {};
    if (!username) {
      res.status(401).send('Not logged in');
      return;
    }
    if (!language || !objective) {
      res.status(400).send('Missing fields');
      return;
    }
    const ok = await saveUserPrefs(username, language, objective);
    if (ok) {
      res.status(200).send('Saved');
    } else {
      res.status(500).send('Database error');
    }
  });

  app.get('/evaluate', async (req, res) => {
    const cookies = parseCookies(req);
    const username = cookies['user'];
    if (!username) {
      res.redirect('/login');
      return;
    }
    if (!(await hasUserPrefs(username))) {
      res.redirect('/first-login');
      return;
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'evaluate.html'));
  });

  app.get('/evaluate/start', async (req, res) => {
    const cookies = parseCookies(req);
    const username = cookies['user'];
    if (!username) {
      res.status(401).send('Not logged in');
      return;
    }
    const questions = await startEvaluation(username);
    if (questions) {
      res.json(questions);
    } else {
      res.status(500).send('Unable to start evaluation');
    }
  });

  app.post('/evaluate/finish', async (req, res) => {
    const cookies = parseCookies(req);
    const username = cookies['user'];
    const { answers } = req.body || {};
    if (!username) {
      res.status(401).send('Not logged in');
      return;
    }
    if (!Array.isArray(answers)) {
      res.status(400).send('Invalid data');
      return;
    }
    const ok = await finishEvaluation(username, answers);
    if (ok) {
      res.status(200).send('Saved');
    } else {
      res.status(500).send('Error');
    }
  });

  app.get('/', (req, res) => {
    const cookies = parseCookies(req);
    if (cookies['user']) {
      res.redirect('/homepage');
    } else {
      res.redirect('/login');
    }
  });

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  return server;
}
