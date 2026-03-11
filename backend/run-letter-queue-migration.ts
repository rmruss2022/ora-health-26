/**
 * Run letter queue and daily letters migration
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './src/config/database';

async function runMigration() {
  try {
    console.log('🔄 Running letter queue migration...');

    const migrationSQL = readFileSync(
      join(__dirname, 'src/db/migrations/014_letter_queue_and_daily_letters.sql'),
      'utf-8'
    );

    await query(migrationSQL);

    console.log('✅ Letter queue migration completed!');
    console.log('Tables created:');
    console.log('  - letter_queue');
    console.log('  - user_daily_letters');
    console.log('  - user_letter_reads');
    console.log('  - delivery_date column on inbox_messages');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
