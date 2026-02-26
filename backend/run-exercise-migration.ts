import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shadowai',
  user: process.env.DB_USER || 'shadowai',
  password: process.env.DB_PASSWORD || 'shadowai_dev_password',
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running exercise system migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '007_create_exercises_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Run migration
    await client.query(migrationSQL);

    console.log('✅ Exercise system migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
