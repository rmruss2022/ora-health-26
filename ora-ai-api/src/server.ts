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
// import analyticsRoutes from './routes/analytics.routes';
// import backgroundRoutes from './routes/background.routes';
// import notificationsRoutes from './routes/notifications.routes';
import { scheduleDailyLetters } from './jobs/daily-letters.cron';
import { startCollectiveSessionScheduler } from './jobs/schedule-collective-sessions.cron';
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
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/background', backgroundRoutes);
// app.use('/api/notifications', notificationsRoutes);

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
  }
});
