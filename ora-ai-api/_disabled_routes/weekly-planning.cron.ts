/**
 * Weekly Planning Cron Job
 * Sends weekly planning prompts on Sundays (or configured day)
 */

import cron from 'node-cron';
import { weeklyPlanningService } from '../services/weekly-planning.service';

/**
 * Start weekly planning scheduler
 * Runs every Sunday at 9:00 AM by default
 * Users can customize timing in their preferences
 */
export function startWeeklyPlanningScheduler(): void {
  // Run every Sunday at 9:00 AM (0 9 * * 0)
  cron.schedule('0 9 * * 0', async () => {
    console.log('⏰ [CRON] Weekly planning scheduler triggered');
    
    try {
      const result = await weeklyPlanningService.sendPlanningPromptsToAll();
      console.log(`✅ [CRON] Planning prompts sent: ${result.sent} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ [CRON] Error in weekly planning scheduler:', error);
    }
  }, {
    timezone: 'America/New_York', // Adjust to your timezone
  });

  console.log('🌅 Weekly planning scheduler initialized (Sundays 9:00 AM EST)');

  // Also check every hour for users with custom times
  cron.schedule('0 * * * *', async () => {
    // This would require more sophisticated logic to check each user's preferred time
    // For now, we use the main Sunday 9 AM slot
    console.log('⏰ [CRON] Hourly check for custom planning times');
  });
}

/**
 * Manual trigger for testing
 */
export async function triggerWeeklyPlanningNow(): Promise<void> {
  console.log('🔧 Manual trigger: Sending weekly planning prompts...');
  
  try {
    const result = await weeklyPlanningService.sendPlanningPromptsToAll();
    console.log(`✅ Manual planning prompts sent: ${result.sent} successful, ${result.failed} failed`);
  } catch (error) {
    console.error('❌ Error in manual planning trigger:', error);
    throw error;
  }
}
