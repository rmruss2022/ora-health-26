import { readFileSync } from 'fs';
import { join } from 'path';
import { query, closePool } from './src/config/database';

async function runMigration() {
  try {
    console.log('🚀 Running threaded comments migration...\n');
    
    const migrationPath = join(__dirname, 'src', 'db', 'migrations', '005_threaded_comments.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    await query(sql);
    console.log('✅ Migration 005_threaded_comments.sql completed successfully!\n');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await closePool();
    process.exit(0);
  }
}

runMigration();
