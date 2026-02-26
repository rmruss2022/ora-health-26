import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shadowai',
  user: process.env.DB_USER || 'shadowai',
  password: process.env.DB_PASSWORD || 'shadowai_dev_password',
});

async function runMigration() {
  const migrationFile = path.join(__dirname, 'src/db/migrations/004_create_letters_system.sql');

  try {
    console.log('📝 Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🔌 Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('🚀 Running migration 004_create_letters_system.sql...');
      await client.query(sql);
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('📋 Created tables:');
      console.log('  - letters');
      console.log('  - letter_threads');
      console.log('  - letter_templates');
      console.log('  - user_letter_preferences');
      console.log('');
      console.log('✨ Seeded letter templates for AI generation');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
