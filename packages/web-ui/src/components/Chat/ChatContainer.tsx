import { useEffect, useCallback, memo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageList } from '@/components/Message/MessageList';
import MessageInput from '@/components/Message/MessageInput';
import { useChat } from '@/hooks/useChat';
import { ErrorAlert } from '@/components/ErrorAlert';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAutoScroll } from '@/hooks/useAutoScroll';

function ChatContainer() {
  const { messages, error, currentStreamingId } = useChatStore();
  const { sendMessage, cancelStream, regenerateMessage, editAndResendMessage, isStreaming } = useChat();
  const { isOnline } = useNetworkStatus();
  const { scrollEndRef, scrollToBottom, isAtBottom } = useAutoScroll();

  // 새 메시지가 도착하면 자동 스크롤 (사용자가 하단에 있을 때만)
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  const handleSendMessage = useCallback(async (content: string) => {
    await sendMessage(content);
    // 사용자가 메시지를 보낼 때 항상 하단으로 스크롤
    setTimeout(scrollToBottom, 100);
  }, [sendMessage, scrollToBottom]);

  const handleRetry = useCallback(() => {
    // 마지막 메시지가 사용자의 메시지인지 확인 (전송 실패 시나리오)
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'user') {
      // 중복을 피하기 위해 재시도 플래그와 함께 마지막 사용자 메시지 다시 보내기
      sendMessage(lastMessage.content, true);
    } else if (lastMessage?.role === 'assistant') {
      // 마지막 어시스턴트 메시지 재성성
      regenerateMessage(lastMessage.id);
    }
  }, [messages, regenerateMessage, sendMessage]);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 어시스턴트 메시지에 내용이 있는 경우에만 Escape 키로 스트리밍 취소
    if (e.key === 'Escape' && currentStreamingId) {
      // 스트리밍 메시지가 존재하고 내용이 있는지 확인
      const streamingMessage = useChatStore.getState().messages.find(msg => msg.id === currentStreamingId);
      if (streamingMessage && streamingMessage.role === 'assistant' && streamingMessage.content.trim().length > 0) {
        cancelStream();
      }
    }
  }, [currentStreamingId, cancelStream]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col min-h-full max-w-5xl mx-auto">
      <div className="flex-1 px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2 dark:text-gray-300">채팅을 시작해보세요</h3>
            <p className="text-sm text-center max-w-md">
              일반 텍스트 메시지를 보내거나, "markdown", "html", "json" 키워드를 포함하면
              <br />
              해당 형식으로 응답을 받을 수 있습니다.<br />
            </p>
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            onRegenerate={regenerateMessage}
            onEditAndResend={editAndResendMessage}
          />
        )}
        
        {error && (
          <div className="sticky bottom-0 mt-4">            
            <ErrorAlert message={error} onRetry={handleRetry} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/20 dark:border-gray-800/50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 px-4 py-4">
        {/* 스크롤 다운 버튼 */}
        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/50 dark:border-white/10 shadow-xl rounded-full p-2 hover:shadow-2xl transition-all dark:text-gray-200"
            aria-label="최신 메시지로 이동"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
        
        {currentStreamingId && (
          <div className="flex items-center justify-center mb-2">
            <LoadingIndicator />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              응답 생성 중...
              {messages.find(msg => msg.id === currentStreamingId && msg.role === 'assistant' && msg.content.trim().length > 0) && ' (ESC로 취소)'}
            </span>
          </div>
        )}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isStreaming}
          disabled={!!currentStreamingId || !isOnline}
        />
      </div>
      
      {/* 스크롤 끝 지점 마커 */}
      <div ref={scrollEndRef} />
    </div>
  );
}

export default memo(ChatContainer);