import { useState, useCallback, useEffect } from 'react';
import { chatAPI } from '../services/api/chatAPI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const welcomeMessages: Record<string, string> = {
  'free-form-chat': "Hello! I'm Ora, your companion for personal growth and reflection. I'm here to listen, guide, and support you. What's on your mind today?",
  'journal-prompt': "Welcome to your journaling session. Let's explore your thoughts and experiences together. What would you like to reflect on today?",
  'guided-exercise': "Welcome! I'm here to guide you through personal growth exercises. What area would you like to focus on: gratitude, cognitive reframing, or values clarification?",
  'progress-analysis': "Hello! I'm here to help you understand your personal growth journey. Share your recent experiences and I'll provide insights on your progress.",
  'weekly-planning': "Welcome to weekly planning! Let's set meaningful intentions for your week ahead. What are your priorities for the coming days?",
  'weekly-review': "Welcome to your weekly review. Let's reflect on what went well, what felt challenging, and what you want to carry forward.",
  'self-compassion-exercise': "Welcome. We'll do a gentle guided exercise to reduce stress and self-criticism. What feels most intense for you right now?",
};

const personaWelcomeMessages: Record<string, string> = {
  'persona-ora': "Hey. I'm Ora \u2014 your space to breathe, reflect, and find your way. What's on your mind today?",
  'persona-genz': "heyyy bestie \ud83d\udc4b i'm Sage. no judgment zone, only vibes here. what's going on fr?",
  'persona-psychotherapist': "Hello, I'm Dr. Avery. I'm glad you're here. Take whatever time you need \u2014 I'm curious to understand what brings you in today.",
};

export const useChat = (behaviorId: string = 'free-form-chat', personaId: string = 'persona-ora') => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set initial welcome message based on persona (if set) or behavior
    const content = personaWelcomeMessages[personaId]
      || welcomeMessages[behaviorId]
      || welcomeMessages['free-form-chat'];
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [behaviorId, personaId]);

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
      // Call the backend API with persona override
      const response = await chatAPI.sendMessage({
        content: text,
        behaviorId: personaId,
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
  }, [personaId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};
