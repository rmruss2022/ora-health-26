/**
 * Daily Letters Cron Job
 * Sends personalized AI-generated letters to users each morning
 * Runs at 8:00 AM daily
 */

import cron from 'node-cron';
import { aiLetterGeneratorService } from '../services/ai-letter-generator.service';

/**
 * Schedule daily letter generation
 * Default: 8:00 AM every day
 */
export function scheduleDailyLetters() {
  // Run at 8:00 AM every day (0 8 * * *)
  const cronExpression = process.env.DAILY_LETTER_CRON || '0 8 * * *';

  cron.schedule(cronExpression, async () => {
    console.log(`[${new Date().toISOString()}] Starting daily letter batch...`);

    try {
      const result = await aiLetterGeneratorService.sendDailyLettersToAllUsers();

      console.log(
        `[${new Date().toISOString()}] Daily letter batch complete:`,
        `${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`
      );

      // Log to metrics/monitoring if configured
      if (process.env.METRICS_ENABLED === 'true') {
        // TODO: Send to monitoring service
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Daily letter batch error:`, error);
      
      // Alert on failure if configured
      if (process.env.ALERTS_ENABLED === 'true') {
        // TODO: Send alert
      }
    }
  });

  console.log(`Daily letter cron scheduled: ${cronExpression}`);
}

/**
 * Run the daily letter batch immediately (for testing)
 */
export async function runDailyLetterBatchNow() {
  console.log('Running daily letter batch immediately...');
  const result = await aiLetterGeneratorService.sendDailyLettersToAllUsers();
  console.log('Batch complete:', result);
  return result;
}

// Export for manual triggering
export { aiLetterGeneratorService };
