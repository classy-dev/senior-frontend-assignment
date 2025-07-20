import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState, useEffect } from 'react';
import ChatContainer from './components/Chat/ChatContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SkipNavigation } from './components/SkipNavigation';
import { ToastContainer } from './components/Toast/ToastContainer';
import { queryClient } from './lib/queryClient';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K: 모바일에서 사이드바 열기
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        const isDesktop = window.innerWidth >= 1024; // lg breakpoint
        if (!isDesktop && !isSidebarOpen) {
          e.preventDefault();
          setIsSidebarOpen(true);
        }
      }
      
      // Shift+ESC: 메시지 입력 필드에 포커스
      if (e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        const messageInput = document.querySelector('textarea[placeholder*="메시지를 입력하세요"]') as HTMLTextAreaElement;
        if (messageInput) {
          messageInput.focus();
          // 커서를 텍스트 끝으로 이동
          const length = messageInput.value.length;
          messageInput.setSelectionRange(length, length);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
          <SkipNavigation />
          <ToastContainer />
          
          {/* 데스크톱 사이드바 */}
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>

          {/* 모바일 사이드바 */}
          <div className="lg:hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 flex flex-col">
            {/* 헤더 */}
            <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                  <div className="flex items-center">
                    {/* 모바일 메뉴 버튼 */}
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400"
                      aria-label="Open sidebar"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <h1 className="ml-4 lg:ml-0 text-lg font-medium text-gray-700 dark:text-gray-200">WorkAI <span className="text-gray-400 dark:text-gray-500 text-sm">0.1</span></h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <ThemeToggleButton />
                  </div>
                </div>
              </div>
            </header>

            {/* 채팅 컨테이너 */}
            <main id="main-content" className="flex-1">
              <ChatContainer />
              <OfflineIndicator />
            </main>
          </div>
        </div>
      </ErrorBoundary>
      {process.env.NODE_ENV !== 'test' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function ThemeToggleButton() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;