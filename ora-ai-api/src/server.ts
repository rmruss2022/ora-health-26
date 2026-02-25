import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import journalRoutes from './routes/journal.routes';
import meditationRoutes from './routes/meditation.routes';
import communityRoutes from './routes/community.routes';
import inboxRoutes from './routes/inbox.routes';
import commentRoutes from './routes/comment.routes';
import profileRoutes from './routes/profile.routes';
import letterRoutes from './routes/letter.routes';
import reactionsRoutes from './routes/reactions.routes';
import collectiveRoutes from './routes/collective.routes';
import reflectionRoutes from './routes/reflection.routes';
import roomRoutes from './routes/room.routes';
// Temporarily disabled due to TS errors - fix later
// import agentRoutes from './routes/agent.routes';
// import quizRoutes from './routes/quiz.routes';
// import notificationsRoutes from './routes/notifications.routes';
// import weeklyPlanningRoutes from './routes/weekly-planning.routes';
// import weeklyReviewRoutes from './routes/weekly-review.routes';
// import exerciseRoutes from './routes/exercise.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import backgroundRoutes from './routes/background.routes';
import { scheduleDailyLetters } from './jobs/daily-letters.cron';
import { startCollectiveSessionScheduler } from './jobs/schedule-collective-sessions.cron';
// Temporarily disabled
// import { startWeeklyPlanningScheduler } from './jobs/weekly-planning.cron';
// import { startWeeklyReviewScheduler } from './jobs/weekly-review.cron';
// import { scheduleDailyQuizReminder, scheduleEveningQuizReminder, scheduleWeeklyStreakReport } from './jobs/daily-quiz-reminder.cron';
// import { scheduleAgentPosts } from './jobs/agent-posts.cron';
import { WebSocketService } from './services/websocket.service';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) || [];

// Middleware
app.use(cors({
  origin: (requestOrigin, callback) => {
    // Allow native apps and server-side requests with no Origin header.
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    const isLocalhost =
      /^http:\/\/localhost:\d+$/.test(requestOrigin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(requestOrigin);
    const isExplicitlyAllowed =
      configuredOrigins.length === 0 || configuredOrigins.includes(requestOrigin);

    if (isLocalhost || isExplicitlyAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${requestOrigin} is not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());

// Serve static notification images
app.use('/notification-images', express.static('public/notification-images'));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/journal', journalRoutes);
app.use('/meditations', meditationRoutes);
app.use('/community', communityRoutes);
app.use('/inbox', inboxRoutes);
app.use('/api', commentRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/reactions', reactionsRoutes);
app.use('/api/collective', collectiveRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/rooms', roomRoutes);
// Temporarily disabled - fix TS errors later
// app.use('/api/agents', agentRoutes);
// app.use('/api/quiz', quizRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/weekly-planning', weeklyPlanningRoutes);
// app.use('/api/weekly-review', weeklyReviewRoutes);
// app.use('/api/exercises', exerciseRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/background', backgroundRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize WebSocket server
const webSocketService = new WebSocketService();
webSocketService.initialize(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🦞 Ora AI API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start cron jobs
  if (process.env.ENABLE_CRON_JOBS !== 'false') {
    scheduleDailyLetters();
    console.log('📬 Daily letter cron job scheduled');
    
    startCollectiveSessionScheduler();
    console.log('🧘 Collective session scheduler started');
    
    // startWeeklyPlanningScheduler();
    // console.log('🌅 Weekly planning scheduler started');
    
    // startWeeklyReviewScheduler();
    // console.log('🌟 Weekly review scheduler started');
    
    // scheduleDailyQuizReminder();
    // console.log('📝 Daily quiz reminder scheduled (9:00 AM)');
    // 
    // scheduleEveningQuizReminder();
    // console.log('🌙 Evening quiz reminder scheduled (8:00 PM)');
    // 
    // scheduleWeeklyStreakReport();
    console.log('📊 Weekly streak report scheduled (Monday 10:00 AM)');
    
    // scheduleAgentPosts();
    console.log('🤖 AI agent posts scheduler started (every 6 hours)');
  }
});
