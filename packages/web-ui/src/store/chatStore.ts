import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Message, ChatState } from '@/types/chat';

interface ChatActions {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  setStreamingId: (id: string | null) => void;
  appendToStreamingMessage: (id: string, content: string) => void;
  truncateMessagesFrom: (id: string) => void;
  editMessage: (id: string, newContent: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  getAbortController: () => AbortController | null;
  setCurrentChatId: (chatId: string | null) => void;
  createNewChat: () => void;
  saveCurrentChat: () => ChatSession | null;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

type ChatStore = ChatState & ChatActions & {
  abortController: AbortController | null;
  currentChatId: string | null;
};

const generateId = () => {
  // crypto.randomUUID()를 사용하되, 지원하지 않는 환경을 위한 폴백 제공
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백: 기존 방식 사용
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 상태
        messages: [],
        error: null,
        currentStreamingId: null,
        abortController: null,
        currentChatId: null,

        // 액션
        addMessage: (message) => {
          const newMessage: Message = {
            ...message,
            id: generateId(),
            timestamp: new Date(),
            contentType: message.role === 'user' ? 'text' : message.contentType,
          };
          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        },

        updateMessage: (id, updates) => {
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, ...updates } : msg
            ),
          }));
        },

        deleteMessage: (id) => {
          set((state) => ({
            messages: state.messages.filter((msg) => msg.id !== id),
          }));
        },

        clearMessages: () => {
          set({ messages: [], error: null, currentStreamingId: null });
        },

        setError: (error) => {
          set({ error });
        },

        setStreamingId: (id) => {
          set({ currentStreamingId: id });
        },

        appendToStreamingMessage: (id, content) => {
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id
                ? { ...msg, content: msg.content + content }
                : msg
            ),
          }));
        },

        truncateMessagesFrom: (id) => {
          const messageIndex = get().messages.findIndex((msg) => msg.id === id);
          if (messageIndex === -1) return;

          set((state) => ({
            messages: state.messages.slice(0, messageIndex),
          }));
        },

        editMessage: (id, newContent) => {
          set((state) => {
            const messageIndex = state.messages.findIndex((msg) => msg.id === id);
            if (messageIndex === -1 || state.messages[messageIndex].role !== 'user') {
              return state; // 메시지를 찾을 수 없거나 사용자 메시지가 아니면 변경하지 않음
            }

            const updatedMessages = state.messages.slice(0, messageIndex + 1).map((msg, index) =>
              index === messageIndex ? { ...msg, content: newContent } : msg
            );

            return { messages: updatedMessages };
          });
        },

        setAbortController: (controller) => {
          set({ abortController: controller });
        },

        getAbortController: () => {
          return get().abortController;
        },

        setCurrentChatId: (chatId) => {
          set({ currentChatId: chatId });
        },

        createNewChat: () => {
          const chatId = generateId();
          set({ currentChatId: chatId, messages: [], error: null });
        },

        saveCurrentChat: () => {
          const state = get();
          if (!state.currentChatId || state.messages.length === 0) return null;

          const title = state.messages[0].content.slice(0, 10) + '...';
          const chatData: ChatSession = {
            id: state.currentChatId,
            title,
            messages: state.messages.filter((msg) => !msg.isStreaming),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 기존 채팅 불러오기
          const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
          
          // 존재하면 업데이트, 그렇지 않으면 새로 추가
          const chatIndex = existingChats.findIndex((chat:  { id: string }) => chat.id === state.currentChatId);
          if (chatIndex !== -1) {
            existingChats[chatIndex] = { ...chatData, createdAt: existingChats[chatIndex].createdAt };
          } else {
            existingChats.unshift(chatData);
          }

          localStorage.setItem('chatSessions', JSON.stringify(existingChats));
          
          // 저장된 채팅 데이터 반환
          return chatIndex !== -1 ? existingChats[chatIndex] : chatData;
        },
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          messages: state.messages.filter((msg) => !msg.isStreaming),
          currentChatId: state.currentChatId,
        }),
        onRehydrateStorage: () => (state) => {
          // 하이드레이션 후 남아있는 스트리밍 메시지 지우기
          if (state) {
            state.currentStreamingId = null;
            state.abortController = null;
            
            // 페이지 새로고침 시 이전 채팅 자동 로드 안 함
            // 항상 새 채팅으로 시작
            state.messages = [];
            state.currentChatId = null;
          }
        },
      }
    )
  )
);