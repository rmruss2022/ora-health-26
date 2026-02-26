import { ChatAPI } from '../../../src/services/api/chatAPI';
import { apiClient } from '../../../src/services/api/apiClient';

jest.mock('../../../src/services/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('ChatAPI', () => {
  let chatAPI: ChatAPI;

  beforeEach(() => {
    chatAPI = new ChatAPI();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message with behavior ID', async () => {
      const mockResponse = {
        content: 'AI response',
        role: 'assistant',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await chatAPI.sendMessage({
        content: 'Hello AI',
        behaviorId: 'free-form-chat',
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/chat/messages', {
        content: 'Hello AI',
        behaviorId: 'free-form-chat',
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        chatAPI.sendMessage({
          content: 'Test',
          behaviorId: 'journal-prompt',
        })
      ).rejects.toThrow('API error');
    });
  });

  describe('getChatHistory', () => {
    it('should get chat history without parameters', async () => {
      const mockHistory = [
        { id: '1', content: 'Message 1', role: 'user', timestamp: new Date() },
        { id: '2', content: 'Response 1', role: 'assistant', timestamp: new Date() },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockHistory);

      const result = await chatAPI.getChatHistory();

      expect(result).toEqual(mockHistory);
      expect(apiClient.get).toHaveBeenCalledWith('/chat/history');
    });

    it('should get chat history with limit parameter', async () => {
      const mockHistory = [
        { id: '1', content: 'Message 1', role: 'user', timestamp: new Date() },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockHistory);

      await chatAPI.getChatHistory({ limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/chat/history?limit=10');
    });

    it('should get chat history with before parameter', async () => {
      const mockHistory = [];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockHistory);

      await chatAPI.getChatHistory({ before: '2024-01-01' });

      expect(apiClient.get).toHaveBeenCalledWith('/chat/history?before=2024-01-01');
    });

    it('should get chat history with both limit and before', async () => {
      const mockHistory = [];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockHistory);

      await chatAPI.getChatHistory({ limit: 5, before: '2024-01-01' });

      expect(apiClient.get).toHaveBeenCalledWith('/chat/history?limit=5&before=2024-01-01');
    });
  });

  describe('switchBehavior', () => {
    it('should switch behavior successfully', async () => {
      const mockResponse = { success: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await chatAPI.switchBehavior('journal-prompt');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/chat/behavior', {
        behaviorId: 'journal-prompt',
      });
    });

    it('should handle switch behavior errors', async () => {
      const error = new Error('Invalid behavior');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        chatAPI.switchBehavior('invalid-behavior')
      ).rejects.toThrow('Invalid behavior');
    });
  });

  describe('getCurrentBehavior', () => {
    it('should get current behavior', async () => {
      const mockResponse = { behaviorId: 'free-form-chat' };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await chatAPI.getCurrentBehavior();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/chat/behavior');
    });

    it('should handle errors getting behavior', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(chatAPI.getCurrentBehavior()).rejects.toThrow('Network error');
    });
  });
});
