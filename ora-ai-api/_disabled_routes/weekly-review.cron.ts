/**
 * Weekly Review Cron Job
 * Sends weekly review prompts on Saturdays/Sundays (or configured day)
 */

import cron from 'node-cron';
import { weeklyReviewService } from '../services/weekly-review.service';

/**
 * Start weekly review scheduler
 * Runs every Sunday at 6:00 PM by default
 * Users can customize timing in their preferences
 */
export function startWeeklyReviewScheduler(): void {
  // Run every Sunday at 6:00 PM (0 18 * * 0)
  cron.schedule('0 18 * * 0', async () => {
    console.log('⏰ [CRON] Weekly review scheduler triggered');
    
    try {
      const result = await weeklyReviewService.sendReviewPromptsToAll();
      console.log(`✅ [CRON] Review prompts sent: ${result.sent} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ [CRON] Error in weekly review scheduler:', error);
    }
  }, {
    timezone: 'America/New_York', // Adjust to your timezone
  });

  console.log('🌟 Weekly review scheduler initialized (Sundays 6:00 PM EST)');

  // Also check every hour for users with custom times
  cron.schedule('0 * * * *', async () => {
    // This would require more sophisticated logic to check each user's preferred time
    // For now, we use the main Sunday 6 PM slot
    console.log('⏰ [CRON] Hourly check for custom review times');
  });
}

/**
 * Manual trigger for testing
 */
export async function triggerWeeklyReviewNow(): Promise<void> {
  console.log('🔧 Manual trigger: Sending weekly review prompts...');
  
  try {
    const result = await weeklyReviewService.sendReviewPromptsToAll();
    console.log(`✅ Manual review prompts sent: ${result.sent} successful, ${result.failed} failed`);
  } catch (error) {
    console.error('❌ Error in manual review trigger:', error);
    throw error;
  }
}
