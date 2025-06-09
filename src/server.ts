// @ts-nocheck
import express from 'express';
import path from 'path';
import { loadCredentials } from './credentials';
import { fetchChatMessage } from './openrouter';
import { checkDbConnection } from './db';

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

  app.post('/register', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).send('Missing username or password');
      return;
    }
    if (users[username]) {
      res.status(409).send('User exists');
      return;
    }
    users[username] = password;
    res.status(201).send('Registered');
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (users[username] === password) {
      res.cookie('user', encodeURIComponent(username), { httpOnly: true });
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  });

  app.get('/homepage', (req, res) => {
    const cookies = parseCookies(req);
    const user = cookies['user'];
    if (!user) {
      res.redirect('/login');
      return;
    }
    const safeUser = String(user).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html><html><head><title>Home</title><link rel="stylesheet" href="/public/styles.css"></head><body><h1>Hello ${safeUser}</h1></body></html>`;
    res.send(html);
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
