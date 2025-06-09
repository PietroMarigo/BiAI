# BiAI

This repository contains a minimal setup for a language learning Progressive Web App (PWA) and backend written in TypeScript. It serves as a starting point to test that the environment works before adding more features.

## Requirements

- Node.js with the TypeScript compiler (`tsc`).
- Optional: Docker (for PostgreSQL and n8n services).
- A `credentials` file in the project root to store environment variables (not committed to version control).

## Setup

1. **Install dependencies**

   This project only relies on Node's built-in modules so no extra packages are required.

2. **Build the TypeScript code**

   ```bash
   npm run build
   ```

3. **Run the server**

   ```bash
   npm start
   ```

   The server listens on port `3000` by default and calls the OpenAI API when `/` is requested. The example PWA (`public/index.html`) fetches this endpoint to display the message from ChatGPT. Static files are available under `/public/`.
   The raw response from OpenAI is printed to the console for debugging.

4. **Run tests**

   ```bash
   npm test
   ```

   The tests start the server, request the `/` route and verify that a response from the OpenAI API (or fallback message) is returned.

## Additional Services

### PostgreSQL Database

The example project does not require a database yet, but the following commands start a local PostgreSQL instance using Docker:

```bash
docker run --name biaipg -p 5432:5432 -e POSTGRES_PASSWORD=example -d postgres
```

Store your actual credentials in the `credentials` file and reference them from environment variables when you expand the application.

### n8n Automation

To experiment with n8n locally you can also use Docker:

```bash
docker run -it --name biai-n8n -p 5678:5678 n8nio/n8n
```

n8n can interact with this project over HTTP APIs. Add your n8n credentials or API keys to the `credentials` file and load them at runtime.

## credentials file

Create a file named `credentials` in the project root to store secrets such as database passwords or API tokens. For the OpenAI integration, set `OPENAI_API_KEY=<your key>` in this file and load it with a tool like `dotenv` or by exporting it before starting the server. This file is listed in `.gitignore` so it will not be committed to the repository.

## Next steps

- Replace the simple HTTP server with a framework of your choice (e.g., Express or Fastify) once you have package access.
- Connect the backend to a database to store user progress.
- Serve the PWA from the backend and integrate authentication.
- Add a Telegram bot that communicates with the same backend to track progress across platforms.
