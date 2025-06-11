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
    if (!cookies['user']) {
      res.redirect('/login');
      return;
    }
    if (!(await hasUserPrefs(user))) {
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
    const user = cookies['user'];
    const { language, objective } = req.body || {};
    if (!user) {
      res.status(401).send('Not logged in');
      return;
    }
    if (!language || !objective) {
      res.status(400).send('Missing fields');
      return;
    }
    const ok = await saveUserPrefs(user, language, objective);
    if (ok) {
      res.status(200).send('Saved');
    } else {
      res.status(500).send('Database error');
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
