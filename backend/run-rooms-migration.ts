import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
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
  try {
    console.log('🚀 Starting meditation rooms migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-meditation-rooms.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Created:');
    console.log('  - meditation_rooms table');
    console.log('  - room_participants table');
    console.log('  - Indexes for performance');
    console.log('  - Helper functions');
    console.log('  - 5 default rooms seeded');
    console.log('');

    // Verify the rooms were created
    const result = await pool.query('SELECT name, theme FROM meditation_rooms ORDER BY created_at');
    console.log('Rooms in database:');
    result.rows.forEach((room, i) => {
      console.log(`  ${i + 1}. ${room.name} (${room.theme})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
