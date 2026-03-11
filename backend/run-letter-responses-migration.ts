/**
 * Run letter_responses migration (016)
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './src/config/database';

async function runMigration() {
  try {
    console.log('🔄 Running letter_responses migration...');

    const migrationSQL = readFileSync(
      join(__dirname, 'src/db/migrations/016_letter_responses.sql'),
      'utf-8'
    );

    await query(migrationSQL);

    console.log('✅ Letter responses migration completed!');
    console.log('Table created: letter_responses');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
