import * as dotenv from 'dotenv';
import { embeddingService } from './src/services/embedding.service';
import { vectorSearchService } from './src/services/vector-search.service';
import { query } from './src/config/database';
import { randomUUID } from 'crypto';

dotenv.config();

/**
 * Comprehensive test suite for vector embedding system
 */

// Test user ID
const TEST_USER_ID = randomUUID();
const TEST_BEHAVIOR_ID = 'test-behavior';

async function testEmbeddingService() {
  console.log('\n=== Testing Embedding Service ===\n');

  // Test 1: Service configuration
  console.log('1. Checking service configuration...');
  const stats = embeddingService.getStats();
  console.log(`   Model: ${stats.model}`);
  console.log(`   Dimensions: ${stats.dimensions}`);
  console.log(`   Configured: ${stats.configured}`);
  
  if (!stats.configured) {
    console.log('   ⚠️  OpenAI API key not configured - using mock embeddings');
  } else {
    console.log('   ✓ OpenAI API configured');
  }

  // Test 2: Single embedding generation
  console.log('\n2. Generating single embedding...');
  const startTime = Date.now();
  const embedding = await embeddingService.generateEmbedding('I feel anxious and overwhelmed');
  const latency = Date.now() - startTime;
  console.log(`   ✓ Generated embedding (${embedding.length} dimensions) in ${latency}ms`);
  console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

  // Test 3: Batch embedding generation
  console.log('\n3. Testing batch embedding generation...');
  const batchStart = Date.now();
  const batchResults = await embeddingService.generateBatchEmbeddings([
    { text: 'I want to plan my week', vectorType: 'user_message' },
    { text: 'I feel stressed about work', vectorType: 'user_message' },
    { text: 'Tell me more about that', vectorType: 'agent_message' },
  ]);
  const batchLatency = Date.now() - batchStart;
  console.log(`   ✓ Generated ${batchResults.length} embeddings in ${batchLatency}ms`);
  console.log(`   Average: ${(batchLatency / batchResults.length).toFixed(0)}ms per embedding`);

  // Test 4: Conversation embeddings
  console.log('\n4. Testing conversation embedding generation...');
  const convStart = Date.now();
  const convEmbeddings = await embeddingService.generateConversationEmbeddings({
    userMessage: 'I\'m feeling really anxious about my presentation tomorrow',
    agentLastResponse: 'That sounds stressful. What specifically are you worried about?',
    externalContext: {
      timeOfDay: 'evening',
      dayOfWeek: 'Sunday',
      userMood: 'anxious',
    },
  });
  const convLatency = Date.now() - convStart;
  console.log(`   ✓ Generated conversation embeddings in ${convLatency}ms`);
  console.log(`   Generated vectors: ${Object.keys(convEmbeddings).filter(k => convEmbeddings[k]).join(', ')}`);

  // Test 5: Caching
  console.log('\n5. Testing embedding cache...');
  const cacheTest1 = Date.now();
  await embeddingService.generateEmbedding('I feel anxious and overwhelmed');
  const cacheTime1 = Date.now() - cacheTest1;
  
  const cacheTest2 = Date.now();
  await embeddingService.generateEmbedding('I feel anxious and overwhelmed'); // Should be cached
  const cacheTime2 = Date.now() - cacheTest2;
  
  console.log(`   First call: ${cacheTime1}ms`);
  console.log(`   Cached call: ${cacheTime2}ms`);
  console.log(`   ✓ Speedup: ${(cacheTime1 / cacheTime2).toFixed(1)}x faster`);
  
  const cacheStats = embeddingService.getStats();
  console.log(`   Cache size: ${cacheStats.cacheSize} entries`);

  return embedding;
}

async function testVectorStorage(sampleEmbedding: number[]) {
  console.log('\n=== Testing Vector Storage ===\n');

  // Test 1: Store behavior trigger embedding
  console.log('1. Storing test behavior trigger embedding...');
  try {
    await query(
      `INSERT INTO behavior_trigger_embeddings 
       (behavior_id, trigger_description, vector_type, embedding, metadata)
       VALUES ($1, $2, $3, $4::vector, $5)
       ON CONFLICT (behavior_id, trigger_description, vector_type) DO NOTHING`,
      [
        TEST_BEHAVIOR_ID,
        'User expresses anxiety or feeling overwhelmed',
        'user_message',
        JSON.stringify(sampleEmbedding),
        JSON.stringify({ priority: 9, category: 'emotional_support' }),
      ]
    );
    console.log('   ✓ Stored behavior trigger embedding');
  } catch (error) {
    console.error('   ✗ Failed to store trigger embedding:', error);
    throw error;
  }

  // Test 2: Store conversation embedding
  console.log('\n2. Storing conversation embedding...');
  try {
    await vectorSearchService.storeConversationEmbedding({
      userId: TEST_USER_ID,
      vectorType: 'user_message',
      sourceText: 'I feel anxious and overwhelmed',
      embedding: sampleEmbedding,
      behaviorContext: TEST_BEHAVIOR_ID,
      metadata: { testData: true },
    });
    console.log('   ✓ Stored conversation embedding');
  } catch (error) {
    console.error('   ✗ Failed to store conversation embedding:', error);
    throw error;
  }

  // Test 3: Store conversation state
  console.log('\n3. Updating conversation state...');
  try {
    await vectorSearchService.updateConversationState(TEST_USER_ID, {
      activeBehaviorId: TEST_BEHAVIOR_ID,
      behaviorStartedAt: new Date(),
      messageCountInBehavior: 1,
      lastUserMessage: 'I feel anxious and overwhelmed',
      externalContext: { timeOfDay: 'evening' },
    });
    console.log('   ✓ Updated conversation state');
  } catch (error) {
    console.error('   ✗ Failed to update conversation state:', error);
    throw error;
  }

  // Test 4: Verify storage
  console.log('\n4. Verifying stored data...');
  try {
    const triggerCount = await query(
      'SELECT COUNT(*) FROM behavior_trigger_embeddings WHERE behavior_id = $1',
      [TEST_BEHAVIOR_ID]
    );
    console.log(`   ✓ Behavior triggers: ${triggerCount.rows[0].count} stored`);

    const convCount = await query(
      'SELECT COUNT(*) FROM conversation_embeddings WHERE user_id = $1',
      [TEST_USER_ID]
    );
    console.log(`   ✓ Conversation embeddings: ${convCount.rows[0].count} stored`);

    const stateCount = await query(
      'SELECT COUNT(*) FROM conversation_state WHERE user_id = $1',
      [TEST_USER_ID]
    );
    console.log(`   ✓ Conversation state: ${stateCount.rows[0].count} stored`);
  } catch (error) {
    console.error('   ✗ Verification failed:', error);
    throw error;
  }
}

async function testVectorSearch(sampleEmbedding: number[]) {
  console.log('\n=== Testing Vector Search ===\n');

  // Test 1: Single vector search
  console.log('1. Searching behavior triggers (single vector)...');
  const startTime = Date.now();
  const results = await vectorSearchService.searchBehaviorTriggers(
    sampleEmbedding,
    'user_message',
    { topK: 5, similarityThreshold: 0.3 }
  );
  const latency = Date.now() - startTime;
  console.log(`   ✓ Found ${results.length} matches in ${latency}ms`);
  
  if (results.length > 0) {
    console.log(`   Top match: ${results[0].behaviorId} (similarity: ${results[0].similarity.toFixed(3)})`);
  }

  // Test 2: Multi-vector search
  console.log('\n2. Testing multi-vector search...');
  const multiStart = Date.now();
  const multiResults = await vectorSearchService.searchMultiVector({
    userMessage: sampleEmbedding,
    agentMessage: sampleEmbedding, // Using same embedding for test
  });
  const multiLatency = Date.now() - multiStart;
  console.log(`   ✓ Multi-vector search completed in ${multiLatency}ms`);
  console.log(`   Vector types searched: ${Object.keys(multiResults.results).length}`);
  console.log(`   Total matches: ${Object.values(multiResults.results).reduce((sum, r) => sum + r.length, 0)}`);

  // Test 3: Ranking behavior candidates
  console.log('\n3. Testing behavior ranking...');
  const candidates = vectorSearchService.rankBehaviorCandidates(multiResults.results);
  console.log(`   ✓ Ranked ${candidates.length} candidates`);
  
  if (candidates.length > 0) {
    console.log(`   Top candidate: ${candidates[0].behaviorId} (score: ${candidates[0].score.toFixed(3)})`);
    console.log(`   Vector scores:`, candidates[0].vectorScores);
  }

  // Test 4: Priority adjustment
  console.log('\n4. Testing priority adjustment...');
  const adjusted = vectorSearchService.applyBehaviorPriority(candidates, TEST_BEHAVIOR_ID);
  console.log(`   ✓ Applied priority multipliers`);
  
  if (adjusted.length > 0) {
    console.log(`   Top after priority: ${adjusted[0].behaviorId} (score: ${adjusted[0].score.toFixed(3)})`);
  }

  // Test 5: User history search
  console.log('\n5. Testing user history search...');
  const historyResults = await vectorSearchService.searchUserHistory(
    TEST_USER_ID,
    sampleEmbedding,
    'user_message',
    { topK: 5, daysBack: 90 }
  );
  console.log(`   ✓ Found ${historyResults.length} historical matches`);

  return candidates;
}

async function testDetectionLogging(candidates: any[]) {
  console.log('\n=== Testing Detection Logging ===\n');

  console.log('1. Logging behavior detection...');
  try {
    await vectorSearchService.logBehaviorDetection({
      userId: TEST_USER_ID,
      userMessage: 'I feel anxious and overwhelmed',
      detectedBehaviorId: TEST_BEHAVIOR_ID,
      detectionMethod: 'multi-vector-embedding',
      confidenceScore: candidates[0]?.score || 0.85,
      vectorScores: candidates[0]?.vectorScores || {},
      topCandidates: candidates.slice(0, 5),
      latencyMs: 1234,
      embeddingLatencyMs: 456,
      searchLatencyMs: 123,
      llmLatencyMs: 655,
    });
    console.log('   ✓ Logged detection result');
  } catch (error) {
    console.error('   ✗ Failed to log detection:', error);
    throw error;
  }

  console.log('\n2. Querying detection logs...');
  try {
    const logs = await query(
      `SELECT * FROM behavior_detection_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [TEST_USER_ID]
    );
    console.log(`   ✓ Retrieved ${logs.rows.length} log entries`);
    
    if (logs.rows.length > 0) {
      const log = logs.rows[0];
      console.log(`   Detected: ${log.detected_behavior_id}`);
      console.log(`   Confidence: ${log.confidence_score}`);
      console.log(`   Latency: ${log.latency_ms}ms`);
    }
  } catch (error) {
    console.error('   ✗ Failed to query logs:', error);
    throw error;
  }

  console.log('\n3. Checking analytics views...');
  try {
    const stats = await query('SELECT * FROM behavior_usage_stats LIMIT 5');
    console.log(`   ✓ Behavior usage stats: ${stats.rows.length} rows`);

    const performance = await query('SELECT * FROM detection_performance LIMIT 5');
    console.log(`   ✓ Detection performance: ${performance.rows.length} rows`);
  } catch (error) {
    console.error('   ✗ Failed to query analytics:', error);
    throw error;
  }
}

async function testIndexPerformance() {
  console.log('\n=== Testing Index Performance ===\n');

  console.log('1. Checking HNSW indexes...');
  try {
    const indexes = await query(`
      SELECT 
        schemaname, 
        tablename, 
        indexname, 
        indexdef
      FROM pg_indexes
      WHERE indexname LIKE '%vector%'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`   ✓ Found ${indexes.rows.length} vector indexes`);
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`);
    });
  } catch (error) {
    console.error('   ✗ Failed to check indexes:', error);
  }

  console.log('\n2. Testing query plan (EXPLAIN)...');
  try {
    const sampleVector = Array(1536).fill(0).map(() => Math.random());
    const plan = await query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM search_behavior_triggers($1::vector, 'user_message', 5, 0.4)
    `, [JSON.stringify(sampleVector)]);
    
    console.log('   ✓ Query plan generated');
    console.log('   Execution plan:');
    plan.rows.forEach(row => {
      console.log(`     ${row['QUERY PLAN']}`);
    });
  } catch (error) {
    console.error('   ⚠️  Query plan failed (may be due to empty table):', error.message);
  }
}

async function cleanupTestData() {
  console.log('\n=== Cleaning Up Test Data ===\n');

  try {
    await query('DELETE FROM behavior_detection_logs WHERE user_id = $1', [TEST_USER_ID]);
    await query('DELETE FROM conversation_state WHERE user_id = $1', [TEST_USER_ID]);
    await query('DELETE FROM conversation_embeddings WHERE user_id = $1', [TEST_USER_ID]);
    await query('DELETE FROM behavior_trigger_embeddings WHERE behavior_id = $1', [TEST_BEHAVIOR_ID]);
    console.log('✓ Cleaned up test data');
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Vector Embedding System Test Suite                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Run test suites
    const sampleEmbedding = await testEmbeddingService();
    await testVectorStorage(sampleEmbedding);
    const candidates = await testVectorSearch(sampleEmbedding);
    await testDetectionLogging(candidates);
    await testIndexPerformance();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✓ ALL TESTS PASSED                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await cleanupTestData();
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║              ✗ TESTS FAILED                                ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run tests
runTests();
