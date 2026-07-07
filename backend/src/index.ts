import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import Configurations & Jobs
import { db } from './config/db';
import { initCronJobs } from './jobs/cronJobs';

// Import Middlewares
import { authenticateJWT } from './middleware/auth';
import {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter
} from './middleware/security';

// Import Controllers
import { AuthController } from './controllers/authController';
import { LogController } from './controllers/logController';
import { MealController } from './controllers/mealController';
import { ProfileController } from './controllers/profileController';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Global Middleware Binding
app.use(express.json());
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 2. Authentication Routing (Apply authLimiter for brute-force defense)
const authRouter = express.Router();
authRouter.use(authLimiter);
authRouter.post('/signup', AuthController.signup);
authRouter.post('/login', AuthController.login);
authRouter.post('/google', AuthController.googleOAuthMock);
authRouter.post('/apple', AuthController.appleOAuthMock);
app.use('/api/v1/auth', authRouter);

// 3. Protected Health Assistant Routing (Apply JWT verification & standard apiLimiter)
const apiRouter = express.Router();
apiRouter.use(apiLimiter);
apiRouter.use(authenticateJWT as any); // Cast middleware for express types compatibility

// Daily Tracker / Workouts Logging
apiRouter.get('/logs/today', LogController.getTodaySummary);
apiRouter.post('/logs/update', LogController.updateMetrics);
apiRouter.post('/logs/workout', LogController.addWorkout);
apiRouter.delete('/logs/workout/:id', LogController.deleteWorkout);
apiRouter.get('/logs/history', LogController.getHistory);

// Meal Recommendation Planner
apiRouter.get('/meals', MealController.getMealPlan);
apiRouter.post('/meals/generate', MealController.generateMealPlan);

// User Profile & Reminder Configuration
apiRouter.get('/profile', ProfileController.getProfile);
apiRouter.put('/profile', ProfileController.updateProfile);
apiRouter.get('/profile/reminders', ProfileController.getReminders);
apiRouter.put('/profile/reminders', ProfileController.updateReminders);

app.use('/api/v1', apiRouter);

// 4. Global 404 Route Catch
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint resource not found.' });
});

// 5. Global Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err.message || err);
  res.status(500).json({ error: 'Internal Server Error.' });
});

// 6. Start Web Server and Cron Jobs
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  LifeTrack REST API Server running on port ${PORT}`);
  console.log(`  Target Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
  
  // Start node-cron routines
  initCronJobs();
});

// 7. Handle Graceful Shutdown Process
const handleGracefulShutdown = async (signal: string) => {
  console.log(`Received signal ${signal}. Shutting down Express server gracefully...`);
  
  server.close(async () => {
    console.log('HTTP web server closed.');
    
    try {
      await db.close();
      console.log('PostgreSQL database pool connections closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during PostgreSQL shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
// Trigger ts-node-dev reload after zombie port kill
