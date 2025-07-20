import { useState, useCallback, memo, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/types/chat';
import { useChatSessions, useSearchChatSessions } from '@/hooks/useChatQueries';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}



export const ChatHistory = memo(() => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { messages, clearMessages, addMessage, currentChatId, setCurrentChatId } = useChatStore();
  
  // React Query를 사용하여 세션 데이터 관리
  const { data: allSessions = [] } = useChatSessions();
  const { data: searchResults } = useSearchChatSessions(searchQuery);
  const sessions = searchQuery ? searchResults || [] : allSessions;

  // Save current session (새 대화 시작)
  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0) return;

    // Clear current messages and start new chat
    clearMessages();
    setCurrentChatId(null);
  }, [messages, clearMessages, setCurrentChatId]);

  // Load session
  const loadSession = useCallback((sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Clear current messages
    clearMessages();
    
    // Set current chat ID for continuity
    setCurrentChatId(sessionId);
    
    // Load session messages
    session.messages.forEach(msg => {
      addMessage({
        role: msg.role,
        content: msg.content,
        contentType: msg.contentType,
      });
    });

    setSelectedSessionId(sessionId);
    setIsOpen(false);
  }, [allSessions, clearMessages, addMessage, setCurrentChatId]);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    const stored = localStorage.getItem('chatSessions');
    if (stored) {
      const sessions = JSON.parse(stored);
      const updated = sessions.filter((s: { id: string }) => s.id !== sessionId);
      localStorage.setItem('chatSessions', JSON.stringify(updated));
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  }, [queryClient]);

  // Export session
  const exportSession = useCallback((session: ChatSession, format: 'json' | 'markdown') => {
    let content: string;
    const filename = `chat_${session.id}_${new Date().toISOString()}`;

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
    } else {
      // Markdown format
      content = `# ${session.title}\n\n`;
      content += `Created: ${session.createdAt.toLocaleString()}\n\n`;
      content += '---\n\n';
      
      session.messages.forEach(msg => {
        content += `**${msg.role === 'user' ? '사용자' : 'AI'}**: ${msg.content}\n\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/markdown' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'json' ? 'json' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Storage 변경 감지 및 React Query 무효화
  useEffect(() => {
    const handleStorageChange = () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-20 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        aria-label="채팅 히스토리 열기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="bg-white w-96 h-full shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">채팅 히스토리</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="닫기"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={saveCurrentSession}
                  disabled={messages.length === 0}
                  className={clsx(
                    'px-3 py-1 rounded text-sm',
                    messages.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  새 대화 시작
                </button>
                {/* <button
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                  className={clsx(
                    'px-3 py-1 rounded text-sm',
                    messages.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  )}
                >
                  채팅 히스토리 모두 삭제
                </button> */}
              </div>

              <input
                type="text"
                placeholder="대화 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">저장된 대화가 없습니다</p>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.id}
                    className={clsx(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      currentChatId === session.id
                        ? 'border-green-500 bg-green-50'
                        : selectedSessionId === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm truncate flex-1">{session.title}</h3>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSession(session, 'json');
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          aria-label="JSON으로 내보내기"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSession(session, 'markdown');
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          aria-label="Markdown으로 내보내기"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          aria-label="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {session.messages.length}개 메시지 · {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
});