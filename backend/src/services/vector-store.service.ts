import { Pool } from 'pg';
import { embeddingService } from './embedding.service';

interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

interface BehaviorTrigger {
  behavior_id: string;
  trigger_text: string;
  metadata?: Record<string, any>;
}

export class VectorStoreService {
  private pool: Pool;
  private memoryStore: Map<string, { embedding: number[]; metadata: any }>;
  private useMemory: boolean;

  constructor(pool?: Pool) {
    this.pool = pool || new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.memoryStore = new Map();
    // Use memory mode if pgvector not available
    this.useMemory = process.env.VECTOR_STORE_MODE === 'memory';
  }

  /**
   * Initialize pgvector extension and create tables
   */
  async initialize(): Promise<void> {
    if (this.useMemory) {
      console.log('Vector store initialized in memory mode');
      return;
    }

    try {
      // Enable pgvector extension
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create embeddings table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          embedding vector(1536),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create behavior_triggers_embeddings table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS behavior_triggers_embeddings (
          id SERIAL PRIMARY KEY,
          behavior_id TEXT NOT NULL,
          trigger_text TEXT NOT NULL,
          embedding vector(1536),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create HNSW index for fast similarity search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS behavior_triggers_embedding_idx 
        ON behavior_triggers_embeddings 
        USING hnsw (embedding vector_cosine_ops)
      `);

      console.log('Vector store initialized with pgvector');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      console.log('Falling back to memory mode');
      this.useMemory = true;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Store behavior trigger embeddings
   */
  async storeTriggerEmbeddings(triggers: BehaviorTrigger[]): Promise<void> {
    const startTime = Date.now();

    // Generate embeddings for all trigger texts
    const texts = triggers.map(t => t.trigger_text);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    if (this.useMemory) {
      // Store in memory
      triggers.forEach((trigger, idx) => {
        const key = `behavior:${trigger.behavior_id}:${idx}`;
        this.memoryStore.set(key, {
          embedding: embeddings[idx],
          metadata: {
            behavior_id: trigger.behavior_id,
            trigger_text: trigger.trigger_text,
            ...trigger.metadata,
          },
        });
      });
    } else {
      // Store in PostgreSQL
      const values = triggers.map((trigger, idx) => [
        trigger.behavior_id,
        trigger.trigger_text,
        JSON.stringify(embeddings[idx]),
        JSON.stringify(trigger.metadata || {}),
      ]);

      const queryText = `
        INSERT INTO behavior_triggers_embeddings 
        (behavior_id, trigger_text, embedding, metadata)
        VALUES ${values.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')}
      `;

      const queryValues = values.flat();
      await this.pool.query(queryText, queryValues);
    }

    const duration = Date.now() - startTime;
    console.log(`Stored ${triggers.length} behavior trigger embeddings in ${duration}ms`);
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 20
  ): Promise<VectorSearchResult[]> {
    const startTime = Date.now();

    if (this.useMemory) {
      // Memory-based search
      const results: VectorSearchResult[] = [];

      for (const [id, data] of this.memoryStore.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
        results.push({
          id,
          content: data.metadata.trigger_text || '',
          similarity,
          metadata: data.metadata,
        });
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);

      const duration = Date.now() - startTime;
      if (duration > 100) {
        console.warn(`Memory search took ${duration}ms (target: <100ms)`);
      }

      return results.slice(0, topK);
    } else {
      // PostgreSQL pgvector search
      const queryText = `
        SELECT 
          id::TEXT,
          trigger_text as content,
          1 - (embedding <=> $1::vector) as similarity,
          metadata
        FROM behavior_triggers_embeddings
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      const result = await this.pool.query(queryText, [
        JSON.stringify(queryEmbedding),
        topK,
      ]);

      const duration = Date.now() - startTime;
      if (duration > 100) {
        console.warn(`Database search took ${duration}ms (target: <100ms)`);
      }

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata,
      }));
    }
  }

  /**
   * Find top-K most similar behavior triggers
   */
  async topKSimilar(queryText: string, topK: number = 20): Promise<VectorSearchResult[]> {
    // Generate embedding for query text
    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    
    // Search for similar vectors
    return this.searchSimilar(queryEmbedding, topK);
  }

  /**
   * Clear all stored embeddings
   */
  async clearAll(): Promise<void> {
    if (this.useMemory) {
      this.memoryStore.clear();
    } else {
      await this.pool.query('TRUNCATE behavior_triggers_embeddings');
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    if (this.useMemory) {
      return {
        mode: 'memory',
        count: this.memoryStore.size,
      };
    } else {
      const result = await this.pool.query(
        'SELECT COUNT(*) as count FROM behavior_triggers_embeddings'
      );
      return {
        mode: 'postgresql',
        count: parseInt(result.rows[0].count),
      };
    }
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreService();
