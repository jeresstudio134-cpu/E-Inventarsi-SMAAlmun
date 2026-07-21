import app from '../server.js';
import { initDb } from '../server/db.js';

let isDbInitialized = false;

// Middleware to ensure database tables are initialized in Vercel Serverless environment
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.error('Error initializing database in Vercel Serverless environment:', err);
    }
  }
  next();
});

export default app;
