// Migration Runner
// Executes SQL migration files against the database

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, closePool } from '../config/database';

const migrationsDir = join(__dirname, '..', 'db', 'migrations');

const migrations = [
  '001_create_users.sql',
  '002_create_refresh_tokens.sql',
  '003_inbox_and_categories.sql',
  '004_create_letters_system.sql',
  '004_create_user_profiles.sql',
  '004_pgvector_setup.sql',
  '005_threaded_comments.sql',
];

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  for (const migration of migrations) {
    try {
      console.log(`📝 Running migration: ${migration}`);
      const migrationPath = join(migrationsDir, migration);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      await query(sql);
      console.log(`✅ Completed: ${migration}\n`);
    } catch (error: any) {
      console.error(`❌ Failed: ${migration}`);
      console.error(error.message);
      console.error('\n');
      process.exit(1);
    }
  }

  console.log('🎉 All migrations completed successfully!');
  await closePool();
  process.exit(0);
}

// Run migrations
runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
