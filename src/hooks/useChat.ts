import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { streamGenerateCode } from '../services/gemini';
import { addConversation } from '../services/supabase';

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (
    content: string,
    projectId?: string,
    context?: string,
  ) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string, projectId?: string, context?: string) => {
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 持久化用户消息到 Supabase
      if (projectId) {
        addConversation({
          project_id: projectId,
          role: 'user',
          content,
          metadata: {},
        }).catch(console.error);
      }

      // 创建一个占位的 assistant 消息（流式填充）
      const assistantId = `msg-${Date.now()}-assistant`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setLoading(true);

      try {
        const fullText = await streamGenerateCode(
          content,
          (chunk: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + chunk }
                  : msg,
              ),
            );
          },
          context,
        );

        // 流式完成，标记不再 streaming
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: fullText, isStreaming: false }
              : msg,
          ),
        );

        // 持久化 assistant 消息到 Supabase
        if (projectId) {
          addConversation({
            project_id: projectId,
            role: 'assistant',
            content: fullText,
            metadata: {},
          }).catch(console.error);
        }
      } catch (error) {
        const errorText =
          error instanceof Error ? error.message : 'Generation failed';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `Error: ${errorText}`,
                  isStreaming: false,
                }
              : msg,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, sendMessage, clearMessages };
}
