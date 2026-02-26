import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shadowai',
  user: process.env.DB_USER || 'shadowai',
  password: process.env.DB_PASSWORD || 'shadowai_dev_password',
});

async function testConnection() {
  console.log('🔌 Testing database connection...');
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`Database: ${process.env.DB_NAME || 'shadowai'}`);
  console.log(`User: ${process.env.DB_USER || 'shadowai'}`);
  console.log('');

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('');
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
