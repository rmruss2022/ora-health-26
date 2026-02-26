// Run Single Migration - 004
import { readFileSync } from 'fs';
import { join } from 'path';
import { query, closePool } from '../config/database';

async function runMigration004() {
  console.log('🚀 Running migration 004_create_user_profiles.sql...\n');

  try {
    const migrationPath = join(__dirname, '..', 'db', 'migrations', '004_create_user_profiles.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    await query(sql);
    console.log('✅ Migration completed successfully!\n');
  } catch (error: any) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  }

  await closePool();
  process.exit(0);
}

runMigration004();
