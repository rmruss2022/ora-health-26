import { useState, useCallback, useEffect } from 'react';
import { chatAPI } from '../services/api/chatAPI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const welcomeMessages: Record<string, string> = {
  'free-form-chat': "Hello! I'm Shadow AI, your companion for personal growth and reflection. I'm here to listen, guide, and support you. What's on your mind today?",
  'journal-prompt': "Welcome to your journaling session. Let's explore your thoughts and experiences together. What would you like to reflect on today?",
  'guided-exercise': "Welcome! I'm here to guide you through personal growth exercises. What area would you like to focus on: gratitude, cognitive reframing, or values clarification?",
  'progress-analysis': "Hello! I'm here to help you understand your personal growth journey. Share your recent experiences and I'll provide insights on your progress.",
  'weekly-planning': "Welcome to weekly planning! Let's set meaningful intentions for your week ahead. What are your priorities for the coming days?",
};

export const useChat = (behaviorId: string = 'free-form-chat') => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set initial welcome message based on behavior
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessages[behaviorId] || welcomeMessages['free-form-chat'],
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [behaviorId]);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call the backend API
      const response = await chatAPI.sendMessage({
        content: text,
        behaviorId: behaviorId,
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [behaviorId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};
