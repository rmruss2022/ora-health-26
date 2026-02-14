import { EmbeddingService } from '../embedding.service';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn(),
      },
    })),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmbeddingService();
    const OpenAI = require('openai').default;
    const instance = new OpenAI();
    mockCreate = instance.embeddings.create;
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for valid text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await service.generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: 'test text',
      });
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow('Text cannot be empty');
    });

    it('should use cached result on second call', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      // First call
      const result1 = await service.generateEmbedding('cached text');
      
      // Second call (should use cache)
      const result2 = await service.generateEmbedding('cached text');

      expect(result1).toEqual(result2);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        new Array(1536).fill(0).map(() => Math.random()),
        new Array(1536).fill(0).map(() => Math.random()),
        new Array(1536).fill(0).map(() => Math.random()),
      ];

      mockCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding })),
      });

      const texts = ['text 1', 'text 2', 'text 3'];
      const results = await service.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(3);
      expect(results).toEqual(mockEmbeddings);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: texts,
      });
    });

    it('should handle empty array', async () => {
      const results = await service.generateBatchEmbeddings([]);
      expect(results).toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should filter out empty strings', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const texts = ['valid text', '', '  '];
      const results = await service.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: ['valid text'],
      });
    });

    it('should use cache for previously embedded texts', async () => {
      const mockEmbedding1 = new Array(1536).fill(0).map(() => Math.random());
      const mockEmbedding2 = new Array(1536).fill(0).map(() => Math.random());

      // First batch
      mockCreate.mockResolvedValueOnce({
        data: [
          { embedding: mockEmbedding1 },
          { embedding: mockEmbedding2 },
        ],
      });

      await service.generateBatchEmbeddings(['text A', 'text B']);

      // Second batch with one cached text
      const mockEmbedding3 = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding3 }],
      });

      const results = await service.generateBatchEmbeddings(['text A', 'text C']);

      expect(results[0]).toEqual(mockEmbedding1); // From cache
      expect(results[1]).toEqual(mockEmbedding3); // New
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache management', () => {
    it('should report cache statistics', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      await service.generateEmbedding('test 1');
      await service.generateEmbedding('test 2');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.ttl).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      await service.generateEmbedding('test');
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});
