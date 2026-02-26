import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './src/config/database';

async function runMigration() {
  console.log('Starting Meditation Collective migration...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-collective-meditation-tables.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);

    console.log('✅ Migration complete!');
    console.log('Created tables:');
    console.log('  - collective_sessions');
    console.log('  - collective_participants');
    console.log('  - daily_prompts');
    console.log('  - reflection_responses');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
