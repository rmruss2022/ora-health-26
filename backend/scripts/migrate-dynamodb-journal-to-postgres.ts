#!/usr/bin/env npx ts-node
/**
 * One-time migration: DynamoDB journal entries → PostgreSQL
 *
 * Prerequisites:
 * - AWS credentials in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * - Migration 012 already run (journal_entries table exists in Postgres)
 *
 * Usage: npx ts-node scripts/migrate-dynamodb-journal-to-postgres.ts
 */

import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { query } from '../src/config/database';

const TABLE = process.env.DYNAMODB_JOURNAL_ENTRIES_TABLE || 'shadow-ai-journal-entries';

async function migrate() {
  const hasAws =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_id';

  if (!hasAws) {
    console.log('⚠️  No AWS credentials found. Skipping DynamoDB migration.');
    console.log('   (If you had journal data in DynamoDB, add AWS_* to .env and re-run)');
    process.exit(0);
  }

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const docClient = DynamoDBDocumentClient.from(client);

  console.log('📥 Scanning DynamoDB journal entries...');
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
    })
  );

  const items = (scanResult.Items || []) as Array<{
    id?: string;
    userId?: string;
    content?: string;
    behaviorId?: string;
    mood?: string;
    tags?: string[];
    isShared?: boolean;
    createdAt?: string;
  }>;

  if (items.length === 0) {
    console.log('   No journal entries found in DynamoDB.');
    process.exit(0);
  }

  console.log(`   Found ${items.length} entries. Migrating to Postgres...`);

  let migrated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.userId || !item.content) {
      skipped++;
      continue;
    }

    try {
      // Check if user exists in Postgres
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [item.userId]
      );
      if (userCheck.rows.length === 0) {
        console.warn(`   Skipping entry ${item.id}: user ${item.userId} not in Postgres`);
        skipped++;
        continue;
      }

      await query(
        `INSERT INTO journal_entries
         (id, user_id, content, mood, tags, behavior_context, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id || require('crypto').randomUUID(),
          item.userId,
          item.content,
          item.mood || null,
          item.tags || [],
          item.behaviorId || null,
          JSON.stringify({ isShared: item.isShared ?? false }),
          item.createdAt ? new Date(item.createdAt) : new Date(),
        ]
      );
      migrated++;
    } catch (err: any) {
      console.error(`   Failed to migrate ${item.id}:`, err.message);
    }
  }

  console.log(`\n✅ Migration complete: ${migrated} migrated, ${skipped} skipped`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
