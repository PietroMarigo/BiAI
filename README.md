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

  The server listens on port `3000` by default. When a user visits `/`, the backend checks for a `user` cookie and redirects to `/homepage` if present or `/login` otherwise. Static files are served from `/public/`.
Login and registration pages are provided in `public/login.html` and `public/register.html`. The backend serves these pages on `GET /login` and `GET /register`. Each page links to `/public/styles.css` for consistent styling. Registration now creates a user record in the PostgreSQL `users` table using the credentials from the `credentials` file (if those variables are present). The code assumes this table already exists; it will not attempt to create it automatically. After logging in successfully, the backend sets a `user` cookie.
  The `/homepage` route sends the static `public/home.html` file after verifying the cookie. If the user has not yet selected a language and objective, the server redirects to `/first-login` instead. That page collects the desired language and learning purpose and stores them in the `user_languages` table, which has columns `username`, `language`, `objective` and `actual_level` (initially set to `beginner`). The `username` column references the `users` table and the `actual_level` column is optional. This page contains a responsive layout that works on mobile and desktop.

4. **Run tests**

   ```bash
   npm test
   ```

   The tests start the server, register and log in a user, then request `/homepage` and check that the page contains "Continue where you left off".

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

#### Sample workflow

1. Start n8n and create a workflow with an **HTTP Trigger** node. This endpoint generates the quiz questions. Set the method to `POST` and choose a path such as `/webhook/evaluate`.
2. Add an **AI** or **HTTP Request** node that sends the incoming `language` and `objective` fields to your preferred model. Format the response as JSON that contains the questions (with answers) and connect it back to a **Respond to Webhook** node.
3. Create a second workflow with another **HTTP Trigger** node on `/webhook/evaluate/finish`. This receives the original quiz together with the user's answers and returns the detected level. Optionally update the database with a **PostgreSQL** node.
4. Note the external URL of the first trigger and set `N8N_WEBHOOK_URL=<url>` in the `credentials` file. Set `N8N_GRADE_URL=<url>` to the second workflow so the server knows where to send answers for grading.
5. To have the backend wait for the workflow to complete, use the webhook URL with `?wait=1` or omit the parameter and let the server append it automatically. This keeps the connection open until n8n sends the generated questions.
6. The home page's **Start** button now directs users to `/evaluate/loading`, a small page that starts the webhook request and polls `/evaluate/questions` until the quiz is ready before redirecting to `/evaluate`.
7. The grading workflow should respond with a JSON object containing a `level` field and an optional `suggestion`. The backend can parse responses wrapped in Markdown code fences. The evaluation page displays the returned level and advice after submitting the answers.

## credentials file

Create a file named `credentials` in the project root to store secrets such as database passwords or API tokens. For the OpenRouter integration, set `OPEN_ROUTER_KEY=<your key>` in this file. Database variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`) are optional; when provided they enable writing new accounts to the `users` table. The server reads this file automatically so you don't need to load it manually. Values should be written without surrounding quotes (e.g. `DB_USER=biaiuser`); any quotes will be stripped automatically but are best avoided. This file is listed in `.gitignore` so it will not be committed to the repository.

## Next steps

- Connect the backend to a database to store user progress.
- Serve the PWA from the backend and integrate authentication.
- Add a Telegram bot that communicates with the same backend to track progress across platforms.
