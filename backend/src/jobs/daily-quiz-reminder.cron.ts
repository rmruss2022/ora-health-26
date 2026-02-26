import cron from 'node-cron';
import { quizService } from '../services/quiz.service';
import pool from '../db/pool';

/**
 * Daily Quiz Reminder Cron Job
 * Runs every day at 9:00 AM
 * Sends push notifications to users who haven't completed today's quiz
 */

export function scheduleDailyQuizReminder() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running daily quiz reminder job...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's quiz (or create it)
      const quiz = await quizService.getTodaysQuiz();

      // Get all active users
      const usersResult = await pool.query(
        'SELECT id, email, name FROM users WHERE active = true'
      );

      let remindersSent = 0;
      let alreadyCompleted = 0;

      for (const user of usersResult.rows) {
        try {
          // Check if user has completed today's quiz
          const response = await quizService.getUserQuizResponse(user.id, quiz.id);

          if (!response) {
            // User hasn't completed quiz - send reminder
            // TODO: Integrate with push notification service
            console.log(`📬 Would send reminder to ${user.email}`);
            remindersSent++;
          } else {
            alreadyCompleted++;
          }
        } catch (error) {
          // No response found - send reminder
          console.log(`📬 Would send reminder to ${user.email}`);
          remindersSent++;
        }
      }

      console.log(`✅ Quiz reminders processed:`);
      console.log(`   - Reminders sent: ${remindersSent}`);
      console.log(`   - Already completed: ${alreadyCompleted}`);
    } catch (error) {
      console.error('❌ Error in daily quiz reminder job:', error);
    }
  });

  console.log('✅ Daily quiz reminder scheduled (9:00 AM daily)');
}

/**
 * Evening Check-in Reminder
 * Runs every day at 8:00 PM
 * Reminds users who still haven't completed the quiz
 */
export function scheduleEveningQuizReminder() {
  // Run every day at 8:00 PM
  cron.schedule('0 20 * * *', async () => {
    console.log('🌙 Running evening quiz reminder job...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's quiz
      const quiz = await quizService.getTodaysQuiz();

      // Get users who haven't completed today's quiz
      const result = await pool.query(
        `SELECT u.id, u.email, u.name
         FROM users u
         WHERE u.active = true
         AND NOT EXISTS (
           SELECT 1 FROM quiz_responses qr
           WHERE qr.user_id = u.id
           AND qr.quiz_id = $1
         )`,
        [quiz.id]
      );

      console.log(`📬 Evening reminder: ${result.rows.length} users haven't completed quiz`);

      // TODO: Send push notifications
      for (const user of result.rows) {
        console.log(`   - Reminder for ${user.email}`);
      }
    } catch (error) {
      console.error('❌ Error in evening quiz reminder job:', error);
    }
  });

  console.log('✅ Evening quiz reminder scheduled (8:00 PM daily)');
}

/**
 * Weekly Streak Report
 * Runs every Monday at 10:00 AM
 * Sends users their weekly progress summary
 */
export function scheduleWeeklyStreakReport() {
  // Run every Monday at 10:00 AM
  cron.schedule('0 10 * * 1', async () => {
    console.log('📊 Running weekly streak report job...');

    try {
      const usersResult = await pool.query(
        'SELECT u.id, u.email, u.name, qs.current_streak, qs.longest_streak, qs.total_completed FROM users u LEFT JOIN quiz_streaks qs ON u.id = qs.user_id WHERE u.active = true'
      );

      let reportsGenerated = 0;

      for (const user of usersResult.rows) {
        // Get weekly stats
        const stats = await quizService.getUserQuizStats(user.id, 7);

        console.log(`📈 Weekly report for ${user.email}:`);
        console.log(`   - Current streak: ${user.current_streak || 0} days`);
        console.log(`   - Longest streak: ${user.longest_streak || 0} days`);
        console.log(`   - Total completed: ${user.total_completed || 0}`);
        console.log(`   - Avg mood: ${parseFloat(stats.avg_mood || 0).toFixed(1)}`);
        console.log(`   - Avg energy: ${parseFloat(stats.avg_energy || 0).toFixed(1)}`);

        // TODO: Send email with weekly report
        reportsGenerated++;
      }

      console.log(`✅ Weekly streak reports generated: ${reportsGenerated}`);
    } catch (error) {
      console.error('❌ Error in weekly streak report job:', error);
    }
  });

  console.log('✅ Weekly streak report scheduled (Monday 10:00 AM)');
}
