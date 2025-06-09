// @ts-nocheck
import { startServer } from './server';

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  startServer(PORT);
}
