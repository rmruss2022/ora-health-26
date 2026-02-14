import OpenAI from 'openai';
import NodeCache from 'node-cache';
import crypto from 'crypto';

interface EmbeddingConfig {
  model?: string;
  cacheTTL?: number;
}

export class EmbeddingService {
  private openai: OpenAI;
  private cache: NodeCache;
  private model: string;

  constructor(config: EmbeddingConfig = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Cache embeddings for 1 hour by default
    this.cache = new NodeCache({ 
      stdTTL: config.cacheTTL || 3600,
      checkperiod: 600,
      useClones: false // Store references for performance
    });
    
    this.model = config.model || 'text-embedding-ada-002';
  }

  /**
   * Generate cache key from text
   */
  private getCacheKey(text: string): string {
    return crypto
      .createHash('sha256')
      .update(`${this.model}:${text}`)
      .digest('hex');
  }

  /**
   * Generate embedding for a single text input
   * @param text - Input text to embed
   * @returns Array of embedding values (float[])
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }

    const cacheKey = this.getCacheKey(text);
    
    // Check cache first
    const cached = this.cache.get<number[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });

      const embedding = response.data[0].embedding;
      const latency = Date.now() - startTime;

      // Log if latency exceeds target
      if (latency > 200) {
        console.warn(`Embedding generation took ${latency}ms (target: <200ms)`);
      }

      // Cache the result
      this.cache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts - Array of input texts
   * @returns Array of embedding arrays
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Filter out empty strings
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      return [];
    }

    // Check cache for all texts
    const results: (number[] | null)[] = new Array(validTexts.length).fill(null);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    for (let i = 0; i < validTexts.length; i++) {
      const cacheKey = this.getCacheKey(validTexts[i]);
      const cached = this.cache.get<number[]>(cacheKey);
      
      if (cached) {
        results[i] = cached;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(validTexts[i]);
      }
    }

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return results as number[][];
    }

    try {
      const startTime = Date.now();
      
      // Generate embeddings for uncached texts
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: uncachedTexts,
      });

      const latency = Date.now() - startTime;
      if (latency > 200 * uncachedTexts.length) {
        console.warn(
          `Batch embedding generation took ${latency}ms for ${uncachedTexts.length} texts ` +
          `(average: ${Math.round(latency / uncachedTexts.length)}ms per text)`
        );
      }

      // Store results and cache
      response.data.forEach((embeddingData, idx) => {
        const originalIndex = uncachedIndices[idx];
        const embedding = embeddingData.embedding;
        
        results[originalIndex] = embedding;
        
        // Cache the result
        const cacheKey = this.getCacheKey(uncachedTexts[idx]);
        this.cache.set(cacheKey, embedding);
      });

      return results as number[][];
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Clear all cached embeddings
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / 
        (this.cache.getStats().hits + this.cache.getStats().misses || 1)
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
