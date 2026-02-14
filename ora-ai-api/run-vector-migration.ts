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

async function runVectorMigration() {
  const migrationFile = path.join(__dirname, 'src/db/migrations/006_pgvector_setup.sql');

  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('Running migration 006_pgvector_setup.sql...');
      await client.query(sql);
      console.log('✓ Migration completed successfully!');
      
      // Verify vector extension is enabled
      const result = await client.query(`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `);
      
      if (result.rows.length > 0) {
        console.log('✓ pgvector extension is enabled');
      } else {
        console.error('⚠️  pgvector extension not found - you may need to use pgvector/pgvector Docker image');
      }
      
      // Verify tables were created
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'behavior_trigger_embeddings',
            'conversation_embeddings',
            'conversation_state',
            'behavior_detection_logs',
            'behavior_feedback'
          );
      `);
      
      console.log(`✓ Created ${tables.rows.length}/5 vector tables:`);
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Verify helper functions
      const functions = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN (
            'search_behavior_triggers',
            'search_user_conversation_history'
          );
      `);
      
      console.log(`✓ Created ${functions.rows.length}/2 helper functions:`);
      functions.rows.forEach(row => {
        console.log(`  - ${row.routine_name}`);
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runVectorMigration();
