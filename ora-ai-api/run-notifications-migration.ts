/**
 * Run notifications and weekly planning migration
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './src/config/database';

async function runMigration() {
  try {
    console.log('🔄 Running notifications and weekly planning migration...');

    const migrationSQL = readFileSync(
      join(__dirname, 'src/db/migrations/009_notifications_and_weekly_planning.sql'),
      'utf-8'
    );

    await query(migrationSQL);

    console.log('✅ Notifications and weekly planning migration completed!');
    console.log('Tables created:');
    console.log('  - user_push_tokens');
    console.log('  - user_notification_preferences');
    console.log('  - weekly_plans');
    console.log('  - weekly_reviews');
    console.log('  - push_notification_logs');
    console.log('  - agent_memory_cache');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
