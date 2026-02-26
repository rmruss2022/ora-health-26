import { useState, useCallback, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api/chatAPI';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** True while this assistant message is still being streamed in */
  isStreaming?: boolean;
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

/**
 * Split buffer on paragraph boundaries (\n\n).
 * Returns all complete paragraphs and whatever is still accumulating after the last \n\n.
 * Paragraphs shorter than MIN_CHUNK_CHARS are merged into the next one to avoid
 * firing TTS for tiny fragments.
 */
const MIN_CHUNK_CHARS = 120;

function extractParagraphs(buffer: string): { paragraphs: string[]; remaining: string } {
  const idx = buffer.lastIndexOf('\n\n');
  if (idx === -1) return { paragraphs: [], remaining: buffer };

  const complete = buffer.slice(0, idx);
  const remaining = buffer.slice(idx + 2);

  // Split into raw paragraphs, merging short ones forward
  const raw = complete.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  let acc = '';
  for (const p of raw) {
    acc = acc ? `${acc}\n\n${p}` : p;
    if (acc.length >= MIN_CHUNK_CHARS) {
      paragraphs.push(acc);
      acc = '';
    }
  }
  // Prepend any leftover short paragraph back into remaining
  const leftover = acc ? `${acc}\n\n${remaining}` : remaining;
  return { paragraphs, remaining: leftover };
}

export const useChat = (
  behaviorId: string = 'free-form-chat',
  personaId: string = 'persona-ora',
  options?: { onSegment?: (text: string, messageId: string) => void }
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to cancel any in-flight stream
  const cancelStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cancel any in-flight stream when behavior/persona changes
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }

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
    setIsLoading(false);
    setError(null);
  }, [behaviorId, personaId]);

  const sendMessage = useCallback(
    (text: string) => {
      // Cancel any previous in-flight stream
      if (cancelStreamRef.current) {
        cancelStreamRef.current();
        cancelStreamRef.current = null;
      }

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      // Stable ID for the assistant placeholder bubble
      const assistantId = (Date.now() + 1).toString();

      // Add assistant placeholder immediately so the bubble appears right away
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsLoading(true);
      setError(null);

      let speechBuffer = '';

      const cancel = chatAPI.streamMessage(
        { content: text, behaviorId: personaId },

        // onChunk — append delta text; flip isLoading off on the first chunk
        (chunk: string) => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
          if (options?.onSegment) {
            speechBuffer += chunk;
            const { paragraphs, remaining } = extractParagraphs(speechBuffer);
            speechBuffer = remaining;
            paragraphs.forEach((p) => options.onSegment!(p, assistantId));
          }
        },

        // onDone — mark streaming complete; flush remaining speech buffer
        () => {
          if (options?.onSegment && speechBuffer.trim()) {
            options.onSegment(speechBuffer.trim(), assistantId);
            speechBuffer = '';
          }
          cancelStreamRef.current = null;
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        },

        // onError — replace placeholder with error bubble
        (err: Error) => {
          cancelStreamRef.current = null;
          console.error('Chat stream error:', err);
          setError(err.message || 'Failed to send message');
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: 'Sorry, I encountered an error. Please try again.',
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
      );

      cancelStreamRef.current = cancel;
    },
    [personaId, options]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};
