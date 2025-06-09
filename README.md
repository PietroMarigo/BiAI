# BiAI

This repository contains a minimal setup for a language learning Progressive Web App (PWA) and backend written in TypeScript. It serves as a starting point to test that the environment works before adding more features.

## Requirements

- Node.js with the TypeScript compiler (`tsc`).
- Optional: Docker (for PostgreSQL and n8n services).
- A `credentials` file in the project root to store environment variables (not committed to version control).

## Setup

1. **Install dependencies**

    ```bash
    npm install
    ```

    The server now uses Express for routing, so install dependencies before building.

2. **Build the TypeScript code**

   ```bash
   npm run build
   ```

3. **Run the server**

   ```bash
   npm start
   ```

   The server listens on port `3000` by default and calls the OpenRouter API when `/` is requested using the `deepseek/deepseek-r1-0528:free` model. The example PWA (`public/index.html`) fetches this endpoint to display the message from the selected model. Static files are available under `/public/`
Login and registration pages are provided in `public/login.html` and `public/register.html`. The backend serves these pages on `GET /login` and `GET /register`. Each page uses `public/styles.css` and communicates with the Express backend via `POST /login` and `POST /register` before the main app in `index.html` fetches the message from the server.
   The raw response from OpenRouter is printed to the console for debugging. The Express backend also exposes `/register` and `/login` endpoints that accept JSON bodies.

4. **Run tests**

   ```bash
   npm test
   ```

   The tests start the server, request the `/` route and verify that a response from the OpenRouter API (or fallback message) is returned.

## Additional Services

### PostgreSQL Database

The example project does not require a database yet, but the following commands start a local PostgreSQL instance using Docker:

```bash
docker run --name biaipg -p 5432:5432 -e POSTGRES_PASSWORD=example -d postgres
```

Store your actual credentials in the `credentials` file. The server automatically loads this file at startup so any `KEY=value` pairs become environment variables.

When the server starts it attempts to connect to the database using `DB_HOST` and `DB_PORT` from the environment. The console will indicate whether the connection succeeded or failed.

### n8n Automation

To experiment with n8n locally you can also use Docker:

```bash
docker run -it --name biai-n8n -p 5678:5678 n8nio/n8n
```

n8n can interact with this project over HTTP APIs. Add your n8n credentials or API keys to the `credentials` file and load them at runtime.

## credentials file

Create a file named `credentials` in the project root to store secrets such as database passwords or API tokens. For the OpenRouter integration, set `OPEN_ROUTER_KEY=<your key>` in this file. The server reads the file automatically, so you don't need to load it manually. This file is listed in `.gitignore` so it will not be committed to the repository.

## Next steps

- Connect the backend to a database to store user progress.
- Serve the PWA from the backend and integrate authentication.
- Add a Telegram bot that communicates with the same backend to track progress across platforms.
