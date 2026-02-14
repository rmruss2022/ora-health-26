import { APIClient, APIError } from '../../../src/services/api/apiClient';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the mockAuth module
jest.mock('../../../src/services/api/mockAuth', () => ({
  mockAuth: {
    getOrCreateTestUser: jest.fn().mockResolvedValue('test-token'),
  },
}));

describe('APIClient', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient();
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include auth token when set', async () => {
      const mockData = { success: true };
      const testToken = 'test-token-123';
      
      apiClient.setAuthToken(testToken);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiClient.get('/protected');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testToken}`,
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const mockResponse = { id: 1, created: true };
      const postData = { name: 'New Item' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.post('/items', postData);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should make POST request without body', async () => {
      const mockResponse = { success: true };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await apiClient.post('/action');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = { id: 1, updated: true };
      const updateData = { name: 'Updated Item' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.put('/items/1', updateData);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { success: true };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.delete('/items/1');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should throw APIError on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found', code: 'NOT_FOUND' }),
      });

      await expect(apiClient.get('/missing')).rejects.toThrow(APIError);
      await expect(apiClient.get('/missing')).rejects.toMatchObject({
        message: 'Not found',
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      await expect(apiClient.get('/test')).rejects.toThrow(APIError);
      await expect(apiClient.get('/test')).rejects.toMatchObject({
        message: 'Network request failed',
        statusCode: 0,
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle malformed error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(apiClient.get('/error')).rejects.toThrow(APIError);
      await expect(apiClient.get('/error')).rejects.toMatchObject({
        message: 'Request failed',
        statusCode: 500,
      });
    });
  });

  describe('Token management', () => {
    it('should set auth token', () => {
      const token = 'new-token';
      apiClient.setAuthToken(token);
      
      expect(() => apiClient.setAuthToken(token)).not.toThrow();
    });

    it('should clear auth token', () => {
      apiClient.setAuthToken('token');
      apiClient.clearAuthToken();
      
      expect(() => apiClient.clearAuthToken()).not.toThrow();
    });
  });
});
