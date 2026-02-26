/**
 * Test Notification System
 * Quick verification that all services work
 */

import dotenv from 'dotenv';
import { agentMemoryService } from './src/services/agent-memory.service';
import { weeklyPlanningService } from './src/services/weekly-planning.service';
import { weeklyReviewService } from './src/services/weekly-review.service';

dotenv.config();

async function testNotificationSystem() {
  console.log('🧪 Testing Notification & Weekly Planning System\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Agent Memory Service
    console.log('1️⃣  Testing Agent Memory Service...');
    const testUserId = 'test-user-id'; // Replace with actual user ID
    
    try {
      const memoryContext = await agentMemoryService.getUserMemoryContext(testUserId);
      console.log('   ✅ Agent memory service working');
      console.log('   📊 Memory context keys:', Object.keys(memoryContext));
    } catch (error: any) {
      console.log('   ⚠️  Agent memory service (no user data found - expected)');
    }

    // Test 2: Weekly Planning Service
    console.log('\n2️⃣  Testing Weekly Planning Service...');
    try {
      const currentPlan = await weeklyPlanningService.getCurrentWeekPlan(testUserId);
      console.log('   ✅ Weekly planning service working');
      console.log('   📝 Current plan:', currentPlan ? 'exists' : 'none');
    } catch (error: any) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 3: Weekly Review Service
    console.log('\n3️⃣  Testing Weekly Review Service...');
    try {
      const currentReview = await weeklyReviewService.getCurrentWeekReview(testUserId);
      console.log('   ✅ Weekly review service working');
      console.log('   📝 Current review:', currentReview ? 'exists' : 'none');
    } catch (error: any) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 4: Database Tables
    console.log('\n4️⃣  Testing Database Tables...');
    const { query } = require('./src/config/database');
    
    const tables = [
      'user_push_tokens',
      'user_notification_preferences',
      'weekly_plans',
      'weekly_reviews',
      'push_notification_logs',
      'agent_memory_cache',
    ];

    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (error: any) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n✨ Notification system test complete!');
    console.log('\nTo test with a real user:');
    console.log('1. Update testUserId with an actual user ID from your database');
    console.log('2. Run: npx ts-node test-notification-system.ts\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testNotificationSystem();
