-- Initial Database Setup
-- This file is automatically executed when the PostgreSQL container starts for the first time

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For pgvector support

-- Log startup
SELECT 'Database initialized successfully!' as status;
