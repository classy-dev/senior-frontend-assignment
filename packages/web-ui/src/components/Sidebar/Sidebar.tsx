import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/types/chat';
import clsx from 'clsx';
import { useChatSessions, useSearchChatSessions, chatQueryKeys } from '@/hooks/useChatQueries';
import { useQueryClient } from '@tanstack/react-query';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = memo(({ isOpen, onClose }: SidebarProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, clearMessages, addMessage, currentChatId, setCurrentChatId } = useChatStore();
  const queryClient = useQueryClient();
  
  // React Query를 사용하여 세션 관리
  const { data: allSessions = [] } = useChatSessions();
  const { data: searchResults = [] } = useSearchChatSessions(searchQuery);
  const sessions = searchQuery ? searchResults : allSessions;

  // 사용자가 Mac을 사용하는지 감지
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // 현재 세션 저장 (새 대화 시작)
  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0) return;

    // 현재 메시지를 지우고 새 채팅 시작
    clearMessages();
    setCurrentChatId(null);
  }, [messages, clearMessages, setCurrentChatId]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + O
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        saveCurrentSession();
      }
      
      // Ctrl/Cmd + K - 검색창 포커스 (사이드바가 열려있을 때만)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && isOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select(); // 기존 텍스트 선택
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentSession, isOpen]);

  // 세션 불러오기
  const loadSession = useCallback((sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    // 현재 메시지 지우기
    clearMessages();
    
    // 연속성을 위해 현재 채팅 ID 설정
    setCurrentChatId(sessionId);
    
    // 세션 메시지 불러오기
    session.messages.forEach(msg => {
      addMessage({
        role: msg.role,
        content: msg.content,
        contentType: msg.contentType,
      });
    });

    setSelectedSessionId(sessionId);
    onClose(); // 선택 후 모바일 사이드바 닫기
  }, [allSessions, clearMessages, addMessage, setCurrentChatId, onClose]);

  // 세션 삭제
  const deleteSession = useCallback((sessionId: string) => {
    const stored = localStorage.getItem('chatSessions');
    if (stored) {
      const sessions = JSON.parse(stored);
      const updated = sessions.filter((s: { id: string; }) => s.id !== sessionId);
      localStorage.setItem('chatSessions', JSON.stringify(updated));
      
      // 목록을 새로고침하기 위해 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions() });
    }
    
    // 현재 세션을 삭제하는 경우 새 채팅으로 리디렉션
    if (currentChatId === sessionId) {
      clearMessages();
      setCurrentChatId(null);
      setSelectedSessionId(null);
    }
  }, [currentChatId, clearMessages, setCurrentChatId, queryClient]);

  // 세션 내보내기
  const exportSession = useCallback((session: ChatSession, format: 'json' | 'markdown') => {
    let content: string;
    const filename = `chat_${session.id}_${new Date().toISOString()}`;

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
    } else {
      // 마크다운 형식
      content = `# ${session.title}\n\n`;
      content += `Created: ${session.createdAt.toLocaleString()}\n\n`;
      content += '---\n\n';
      
      session.messages.forEach(msg => {
        content += `**${msg.role === 'user' ? '사용자' : 'AI'}**: ${msg.content}\n\n`;
      });
    }

    // Blob을 생성하여 다운로드
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


  // storage 이벤트로 다른 탭과 동기화
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatSessions' && e.newValue) {
        // React Query 캐시를 즉시 업데이트
        try {
          const newSessions = JSON.parse(e.newValue);
          queryClient.setQueryData(chatQueryKeys.sessions(), newSessions);
        } catch (error) {
          console.error('Failed to parse storage event data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  return (
    <>
      {/* 모바일 백드롭 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <div
        className={clsx(
          'fixed lg:sticky lg:top-0 inset-y-0 lg:inset-y-auto left-0 z-50 w-64 bg-gray-50 dark:bg-gray-900 transform transition-transform duration-300 ease-in-out flex flex-col lg:h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* 로고 및 새 채팅 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8  flex items-center justify-center text-xs text-gray-500">
                <img src="https://images.squarespace-cdn.com/content/v1/607fd5bb9a059244d6b47125/edb4a6bd-bc22-4dc3-af79-a279c318bbc4/favicon.ico" alt="logo" className="w-8 h-8" />
              </div>
              <span className="text-gray-900 dark:text-gray-100 font-medium">nextchapter</span>
            </div>
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={saveCurrentSession}
            className="group w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-inset"
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center text-xs">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon" aria-hidden="true"><path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path></svg>
              </div>
              <span className="text-sm font-medium">새 채팅</span>
            </div>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {isMac ? 'Cmd' : 'Ctrl'}+Shift+O
            </span>
          </button>
        </div>

        {/* 검색 */}
        <div className="px-4 pb-8 border-b border-[#0d0d0d0d]">
          <input
            ref={searchInputRef}
            type="text"
            name="search"
            placeholder={`대화 검색 (${isMac ? 'Cmd' : 'Ctrl'}+K)`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            tabIndex={0}
          />
        </div>

        {/* 세션 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">저장된 대화가 없습니다</p>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  data-chat-session={session.id}
                  className={clsx(
                    'group relative rounded-lg transition-colors cursor-pointer px-3 py-2',
                    currentChatId === session.id
                      ? 'bg-gray-200 dark:bg-gray-800'
                      : selectedSessionId === session.id
                      ? 'bg-gray-200 dark:bg-gray-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:bg-gray-100 dark:focus-within:bg-gray-800'
                  )}
                  tabIndex={0}
                  role="button"
                  aria-label={`대화 로드: ${session.title}`}
                  onClick={() => loadSession(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) {
                      loadSession(session.id);
                    }
                  }}
                  onFocus={() => setFocusedSessionId(session.id)}
                  onBlur={() => setFocusedSessionId(null)}
                >
                  <div>
                    <h3 className="text-sm text-gray-900 dark:text-gray-100 truncate pr-8">{session.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* 액션 버튼 */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSession(session, 'json');
                      }}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 focus:bg-gray-300 dark:focus:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:text-gray-900 dark:focus:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-inset"
                      aria-label="JSON으로 내보내기"
                      tabIndex={focusedSessionId === session.id ? 0 : -1}
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
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 focus:bg-gray-300 dark:focus:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:text-gray-900 dark:focus:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-inset"
                      aria-label="Markdown으로 내보내기"
                      tabIndex={focusedSessionId === session.id ? 0 : -1}
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
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 focus:bg-red-100 dark:focus:bg-red-900/20 rounded text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-inset"
                      aria-label="삭제"
                      tabIndex={focusedSessionId === session.id ? 0 : -1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
});