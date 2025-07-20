import { useQuery } from '@tanstack/react-query';
import { Message } from '@/types/chat';

// React Query를 위한 키
export const chatQueryKeys = {
  all: ['chats'] as const,
  sessions: () => [...chatQueryKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatQueryKeys.all, 'session', id] as const,
  messages: (chatId: string) => [...chatQueryKeys.session(chatId), 'messages'] as const,
};

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 모든 채팅 세션 가져오기
export function useChatSessions() {
  return useQuery({
    queryKey: chatQueryKeys.sessions(),
    queryFn: async (): Promise<ChatSession[]> => {
      const sessionsStr = localStorage.getItem('chatSessions');
      if (!sessionsStr) return [];
      
      try {
        const sessions = JSON.parse(sessionsStr);
        // 날짜 파싱을 필요시에만 수행하도록 변경
        return sessions;
      } catch (error) {
        console.error('Failed to parse chat sessions:', error);
        return [];
      }
    },
    staleTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 5, // 테스트 환경에서는 0, 그 외에는 5분
    gcTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 10, // 테스트 환경에서는 0, 그 외에는 10분
  });
}

// 특정 채팅 세션 가져오기
export function useChatSession(chatId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.session(chatId || ''),
    queryFn: async (): Promise<ChatSession | null> => {
      if (!chatId) return null;
      
      const sessionsStr = localStorage.getItem('chatSessions');
      if (!sessionsStr) return null;
      
      try {
        const sessions = JSON.parse(sessionsStr);
        const session = sessions.find((s: { id: string; }) => s.id === chatId);
        
        if (!session) return null;
        
        // 날짜 파싱을 필요시에만 수행하도록 변경
        return session;
      } catch (error) {
        console.error('Failed to parse chat session:', error);
        return null;
      }
    },
    enabled: !!chatId,
    staleTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 5, // 테스트 환경에서는 0, 그 외에는 5분
    gcTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 10, // 테스트 환경에서는 0, 그 외에는 10분
  });
}

// 채팅 세션 검색
export function useSearchChatSessions(searchQuery: string) {
  const { data: sessions = [] } = useChatSessions();
  
  return useQuery({
    queryKey: [...chatQueryKeys.sessions(), 'search', searchQuery] as const,
    queryFn: async (): Promise<ChatSession[]> => {
      if (!searchQuery.trim()) return sessions;
      
      const lowerQuery = searchQuery.toLowerCase();
      return sessions.filter(session => 
        session.title.toLowerCase().includes(lowerQuery) ||
        session.messages.some(msg => 
          msg.content.toLowerCase().includes(lowerQuery)
        )
      );
    },
    enabled: !!searchQuery,
    staleTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 2, // 테스트 환경에서는 0, 그 외에는 2분
    gcTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 5, // 테스트 환경에서는 0, 그 외에는 5분
  });
}

// 특정 채팅의 메시지 가져오기
export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.messages(chatId || ''),
    queryFn: async (): Promise<Message[]> => {
      if (!chatId) return [];
      
      const sessionsStr = localStorage.getItem('chatSessions');
      if (!sessionsStr) return [];
      
      try {
        const sessions = JSON.parse(sessionsStr);
        const session = sessions.find((s: { id: string; }) => s.id === chatId);
        return session?.messages || [];
      } catch (error) {
        console.error('Failed to parse chat messages:', error);
        return [];
      }
    },
    enabled: !!chatId,
    staleTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 5, // 테스트 환경에서는 0, 그 외에는 5분
    gcTime: process.env.NODE_ENV === 'test' ? 0 : 1000 * 60 * 10, // 테스트 환경에서는 0, 그 외에는 10분
  });
}