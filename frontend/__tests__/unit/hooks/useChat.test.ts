import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from '../../../src/hooks/useChat';
import { chatAPI } from '../../../src/services/api/chatAPI';

// Mock the chat API
jest.mock('../../../src/services/api/chatAPI', () => ({
  chatAPI: {
    sendMessage: jest.fn(),
  },
}));

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with welcome message for free-form-chat', () => {
      const { result } = renderHook(() => useChat('free-form-chat'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        id: 'welcome',
        role: 'assistant',
        content: expect.stringContaining("Hello! I'm Ora"),
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with welcome message for journal-prompt', () => {
      const { result } = renderHook(() => useChat('journal-prompt'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain('journaling session');
    });

    it('should initialize with welcome message for guided-exercise', () => {
      const { result } = renderHook(() => useChat('guided-exercise'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain('guide you through personal growth');
    });

    it('should default to free-form-chat if behavior not recognized', () => {
      const { result } = renderHook(() => useChat('unknown-behavior'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain("Hello! I'm Ora");
    });

    it('should default to free-form-chat if no behavior provided', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain("Hello! I'm Ora");
    });
  });

  describe('sendMessage', () => {
    it('should send message and receive response', async () => {
      const mockResponse = {
        content: 'AI response to your message',
      };

      (chatAPI.sendMessage as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChat('free-form-chat'));

      await act(async () => {
        await result.current.sendMessage('Hello AI');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3); // welcome + user + AI
      });

      const messages = result.current.messages;
      expect(messages[1]).toMatchObject({
        role: 'user',
        content: 'Hello AI',
      });
      expect(messages[2]).toMatchObject({
        role: 'assistant',
        content: 'AI response to your message',
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = { content: 'Response' };
      (chatAPI.sendMessage as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useChat('journal-prompt'));

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(chatAPI.sendMessage).toHaveBeenCalledWith({
        content: 'Test message',
        behaviorId: 'journal-prompt',
      });
    });

    it('should set loading state during API call', async () => {
      const mockResponse = { content: 'Response' };
      
      // Create a promise we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (chatAPI.sendMessage as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useChat('free-form-chat'));

      act(() => {
        result.current.sendMessage('Test');
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      (chatAPI.sendMessage as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useChat('free-form-chat'));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      const messages = result.current.messages;
      expect(messages).toHaveLength(3); // welcome + user + error message
      expect(messages[2]).toMatchObject({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should add user message immediately before API call', async () => {
      // Simulate slow API
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ content: 'Response' }), 100);
      });

      (chatAPI.sendMessage as jest.Mock).mockReturnValueOnce(slowPromise);

      const { result } = renderHook(() => useChat('free-form-chat'));

      act(() => {
        result.current.sendMessage('Quick message');
      });

      // User message should be added immediately
      expect(result.current.messages).toHaveLength(2); // welcome + user
      expect(result.current.messages[1].content).toBe('Quick message');
      expect(result.current.messages[1].role).toBe('user');
    });

    it('should generate unique message IDs', async () => {
      const mockResponse = { content: 'Response' };
      (chatAPI.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChat('free-form-chat'));

      // Add small delay between messages to ensure unique timestamps
      await act(async () => {
        await result.current.sendMessage('Message 1');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(1);
      });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.sendMessage('Message 2');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(5); // welcome + 2 pairs
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Behavior change', () => {
    it('should reset messages when behavior changes', () => {
      const { result, rerender } = renderHook(
        ({ behaviorId }) => useChat(behaviorId),
        { initialProps: { behaviorId: 'free-form-chat' } }
      );

      const firstWelcome = result.current.messages[0].content;

      rerender({ behaviorId: 'journal-prompt' });

      const secondWelcome = result.current.messages[0].content;
      expect(firstWelcome).not.toBe(secondWelcome);
      expect(result.current.messages).toHaveLength(1);
    });
  });
});
