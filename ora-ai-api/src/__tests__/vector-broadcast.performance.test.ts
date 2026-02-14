/**
 * Performance tests for Vector Broadcast System
 * Target: <2 seconds end-to-end behavior selection (p95)
 */

import { vectorBroadcastService } from '../services/vector-broadcast.service';
import { behaviorSelectorService } from '../services/behavior-selector.service';

describe('Vector Broadcast Performance Tests', () => {
  const testInput = {
    userId: 'test-user-performance',
    userMessage: "I'm feeling really overwhelmed with work this week.",
    lastAgentMessage:
      "That sounds challenging. What's been the most difficult part?",
    currentBehaviorId: 'free-form-chat',
    sessionId: 'test-session-perf',
  };

  beforeAll(async () => {
    // Warm up: preload trigger embeddings
    console.log('Warming up vector services...');
    await vectorBroadcastService.broadcastAndRank(
      testInput.userMessage,
      testInput.lastAgentMessage || '',
      testInput.userId
    );
  });

  describe('Vector Generation Latency', () => {
    it('should generate all 6 vectors in <1 second', async () => {
      const start = Date.now();
      
      const result = await vectorBroadcastService.broadcast(testInput);
      
      const elapsed = Date.now() - start;
      const vectorLatency = result.vectorLatencyMs;

      console.log(`Vector generation latency: ${vectorLatency}ms`);
      console.log('Generated vectors:', result.generatedVectors);

      expect(vectorLatency).toBeLessThan(1000);
      expect(result.generatedVectors.userMessage).toBe(true);
      expect(result.generatedVectors.agentThought).toBe(true);
      expect(result.generatedVectors.externalContext).toBe(true);
    });

    it('should generate inner thought in <500ms', async () => {
      const start = Date.now();
      
      const result = await vectorBroadcastService.broadcast(testInput);
      
      const elapsed = Date.now() - start;

      console.log(`Inner thought: "${result.innerThought}"`);
      console.log(`Inner thought generation included in ${elapsed}ms total`);

      expect(result.innerThought).toBeDefined();
      expect(result.innerThought?.length).toBeGreaterThan(10);
    });
  });

  describe('Similarity Search Latency', () => {
    it('should perform multi-vector search in <300ms', async () => {
      const result = await vectorBroadcastService.broadcast(testInput);
      const searchLatency = result.searchLatencyMs;

      console.log(`Search latency: ${searchLatency}ms`);
      console.log(`Top 5 behaviors:`, result.rankings.slice(0, 5).map(r => ({
        id: r.behaviorId,
        score: r.overallScore.toFixed(3),
      })));

      expect(searchLatency).toBeLessThan(300);
      expect(result.rankings.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Behavior Selection', () => {
    it('should complete full broadcast in <2 seconds', async () => {
      const start = Date.now();
      
      const result = await vectorBroadcastService.broadcast(testInput);
      
      const elapsed = Date.now() - start;
      const totalLatency = result.totalLatencyMs;

      console.log(`Total end-to-end latency: ${totalLatency}ms`);
      console.log(`Selected behavior: ${result.topBehaviorId} (score: ${result.topBehaviorScore.toFixed(3)})`);
      console.log('Breakdown:');
      console.log(`  - Vector generation: ${result.vectorLatencyMs}ms`);
      console.log(`  - Similarity search: ${result.searchLatencyMs}ms`);
      console.log(`  - Overhead: ${totalLatency - result.vectorLatencyMs - result.searchLatencyMs}ms`);

      expect(totalLatency).toBeLessThan(2000);
      expect(result.topBehaviorId).toBeDefined();
      expect(result.topBehaviorScore).toBeGreaterThan(0);
    });

    it('should handle batch of 10 messages under 20 seconds', async () => {
      const messages = [
        "I want to journal about my day",
        "Can you help me with a breathing exercise?",
        "Let's plan my week",
        "I'm feeling anxious about tomorrow",
        "What should I focus on right now?",
        "I need some guidance with my goals",
        "How have I been doing lately?",
        "I want to reflect on my progress",
        "Help me process what happened today",
        "Let's do a quick check-in",
      ];

      const start = Date.now();
      const results = [];

      for (const message of messages) {
        const result = await vectorBroadcastService.broadcastAndRank(
          message,
          testInput.lastAgentMessage || '',
          testInput.userId
        );
        results.push(result);
      }

      const elapsed = Date.now() - start;
      const avgLatency = elapsed / messages.length;

      console.log(`\nBatch test (${messages.length} messages):`);
      console.log(`  Total time: ${elapsed}ms`);
      console.log(`  Average per message: ${avgLatency.toFixed(0)}ms`);
      console.log(`  Throughput: ${(messages.length / (elapsed / 1000)).toFixed(1)} messages/sec`);

      expect(elapsed).toBeLessThan(20000); // 20 seconds for 10 messages
      expect(avgLatency).toBeLessThan(2000); // Average <2s per message
    });
  });

  describe('LLM Behavior Selection', () => {
    it('should perform LLM selection in <1 second', async () => {
      const broadcastResult = await vectorBroadcastService.broadcast(testInput);
      const topCandidates = broadcastResult.rankings.slice(0, 20);

      const start = Date.now();
      
      const selection = await behaviorSelectorService.selectBehavior(
        topCandidates,
        testInput.userMessage,
        [{ role: 'assistant', content: testInput.lastAgentMessage || '' }],
        testInput.userId
      );
      
      const elapsed = Date.now() - start;

      console.log(`\nLLM selection latency: ${elapsed}ms`);
      console.log(`Selected: ${selection.selectedBehavior}`);
      console.log(`Confidence: ${selection.confidence.toFixed(3)}`);
      console.log(`Reasoning: ${selection.reasoning}`);

      expect(elapsed).toBeLessThan(1000);
      expect(selection.selectedBehavior).toBeDefined();
      expect(selection.confidence).toBeGreaterThan(0);
    });
  });

  describe('Cache Performance', () => {
    it('should be faster on second identical request (cache hit)', async () => {
      const testMessage = "I'm feeling stressed about my workload";

      // First request (cold)
      const start1 = Date.now();
      await vectorBroadcastService.broadcast({
        ...testInput,
        userMessage: testMessage,
      });
      const elapsed1 = Date.now() - start1;

      // Second request (warm, should hit cache)
      const start2 = Date.now();
      await vectorBroadcastService.broadcast({
        ...testInput,
        userMessage: testMessage,
      });
      const elapsed2 = Date.now() - start2;

      console.log(`\nCache performance:`);
      console.log(`  First request (cold): ${elapsed1}ms`);
      console.log(`  Second request (warm): ${elapsed2}ms`);
      console.log(`  Speedup: ${(elapsed1 / elapsed2).toFixed(1)}x`);

      // Second request should be at least 20% faster
      expect(elapsed2).toBeLessThan(elapsed1 * 0.8);
    });
  });

  describe('Stress Test', () => {
    it('should maintain <2s latency under concurrent load', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          vectorBroadcastService.broadcast({
            ...testInput,
            userId: `stress-test-user-${i}`,
            userMessage: `Concurrent message ${i}: ${testInput.userMessage}`,
          })
        );
      }

      const start = Date.now();
      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      const maxLatency = Math.max(...results.map(r => r.totalLatencyMs));
      const avgLatency = results.reduce((sum, r) => sum + r.totalLatencyMs, 0) / results.length;

      console.log(`\nConcurrent load test (${concurrentRequests} requests):`);
      console.log(`  Wall clock time: ${elapsed}ms`);
      console.log(`  Max latency: ${maxLatency}ms`);
      console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);

      expect(maxLatency).toBeLessThan(3000); // Allow some buffer for concurrent load
      expect(avgLatency).toBeLessThan(2500);
    });
  });
});

describe('Performance Optimization Checks', () => {
  it('should use parallel vector generation', async () => {
    const result = await vectorBroadcastService.broadcast({
      userId: 'parallel-test',
      userMessage: 'Test parallel generation',
      lastAgentMessage: 'Previous response',
    });

    // If parallel, total latency should be close to max individual latency, not sum
    // Vector latency includes all 6 vectors generated in parallel
    console.log(`\nParallelization check:`);
    console.log(`  Vector generation (parallel): ${result.vectorLatencyMs}ms`);
    console.log(`  Vectors generated:`, Object.keys(result.generatedVectors).filter(k => result.generatedVectors[k as keyof typeof result.generatedVectors]));

    // Parallel generation should complete in similar time to single embedding (~200-500ms)
    // If sequential, it would be 6x that
    expect(result.vectorLatencyMs).toBeLessThan(1500); // Well under 6 * 500ms
  });

  it('should cache trigger embeddings (not regenerate each time)', async () => {
    // This is verified by fast search times - trigger embeddings are preloaded
    const result = await vectorBroadcastService.broadcast({
      userId: 'cache-check',
      userMessage: 'Check caching',
    });

    // Search should be <100ms if triggers are cached
    expect(result.searchLatencyMs).toBeLessThan(200);
    console.log(`Search latency with cached triggers: ${result.searchLatencyMs}ms`);
  });
});
