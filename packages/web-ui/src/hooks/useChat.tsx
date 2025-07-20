import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/store/chatStore';
import { ContentType } from '@/types/chat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useChatMutations } from '@/hooks/useChatMutations';
import { errorHandler } from '@/utils/errorHandling';
import { chatQueryKeys } from '@/hooks/useChatQueries';

export function useChat() {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const {
    addMessage,
    setError,
    messages,
    currentChatId,
    createNewChat,
    saveCurrentChat,
  } = useChatStore();
  
  const { messageMutation, cancelStream } = useChatMutations();

  // Assistant 메시지 생성 공통 함수
  const createAssistantMessage = useCallback((contentType: ContentType) => {
    const assistantMessage = {
      role: 'assistant' as const,
      content: '',
      isStreaming: true,
      contentType,
    };
    
    addMessage(assistantMessage);
    
    const addedMessages = useChatStore.getState().messages;
    const actualAssistantMessage = addedMessages[addedMessages.length - 1];
    return actualAssistantMessage?.id;
  }, [addMessage]);

  // 보내기, 재성성, 수정 및 다시 보내기를 위한 통합 메시지 핸들러
  const handleMessage = useCallback(async (
    type: 'send' | 'regenerate' | 'editAndResend',
    params: { content?: string; messageId?: string; newContent?: string; isRetry?: boolean }
  ) => {
    if (!isOnline) {
      // 오프라인 상태에서는 아무 작업도 수행하지 않고, OfflineIndicator가 표시되도록 합니다.
      return;
    }
    setError(null);

    // 유형별 전처리
    if (type === 'send') {
      // 첫 메시지인 경우 새 채팅 생성
      if (!currentChatId && messages.length === 0) {
        createNewChat();
      }
      
      // 재시도가 아닌 경우에만 사용자 메시지 추가 (재시도는 기존 메시지 재사용)
      if (!params.isRetry) {
        const userMessage = {
          role: 'user' as const,
          content: params.content!,
        };
        addMessage(userMessage);
        
        // 사용자 메시지 추가 후 자동 저장
        setTimeout(() => {
          const savedChat = saveCurrentChat();
          if (savedChat) {
            // React Query 캐시 즉시 업데이트
            queryClient.setQueryData(chatQueryKeys.sessions(), (oldData: any[] = []) => {
              const existingIndex = oldData.findIndex((chat: any) => chat.id === savedChat.id);
              if (existingIndex !== -1) {
                const newData = [...oldData];
                newData[existingIndex] = savedChat;
                return newData;
              } else {
                return [savedChat, ...oldData];
              }
            });
          }
        }, 100);
      }
    } else if (type === 'regenerate') {
      const messageIndex = messages.findIndex(msg => msg.id === params.messageId);
      if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
        errorHandler.handle(new Error('재생성할 메시지를 찾을 수 없습니다.'), 'RegenerateMessage');
        return;
      }
      useChatStore.getState().truncateMessagesFrom(params.messageId!);
    } else if (type === 'editAndResend') {
      useChatStore.getState().editMessage(params.messageId!, params.newContent!);
    }

    // 재성성을 위해 이전 메시지에서 콘텐츠 유형 가져오기
    let contentType: ContentType = 'text';
    if (type === 'regenerate') {
      const messageIndex = messages.findIndex(msg => msg.id === params.messageId);
      contentType = messages[messageIndex].contentType || 'text';
    }

    // 어시스턴트 메시지 생성
    const assistantMessageId = createAssistantMessage(contentType);
    if (!assistantMessageId) {
      errorHandler.handle(new Error('메시지 생성에 실패했습니다.'), 'CreateAssistantMessage');
      return;
    }

    // 뮤테이션 실행
    messageMutation.mutate(
      {
        type,
        content: params.content,
        messageId: params.messageId,
        newContent: params.newContent,
        contentType,
        assistantMessageId,
      },
      {
        onSuccess: () => {
          // 어시스턴트 메시지 완료 후 자동 저장
          setTimeout(() => {
            const savedChat = saveCurrentChat();
            if (savedChat) {
              // React Query 캐시 즉시 업데이트
              queryClient.setQueryData(chatQueryKeys.sessions(), (oldData: any[] = []) => {
                const existingIndex = oldData.findIndex((chat: any) => chat.id === savedChat.id);
                if (existingIndex !== -1) {
                  const newData = [...oldData];
                  newData[existingIndex] = savedChat;
                  return newData;
                } else {
                  return [savedChat, ...oldData];
                }
              });
            }
          }, 100);
        },
      }
    );
  }, [addMessage, isOnline, messages, setError, createAssistantMessage, messageMutation]);

  // 통합 핸들러를 사용하는 편의 메소드
  const sendMessage = useCallback((content: string, isRetry = false) => {
    return handleMessage('send', { content, isRetry });
  }, [handleMessage]);

  const regenerateMessage = useCallback((messageId: string) => {
    return handleMessage('regenerate', { messageId });
  }, [handleMessage]);

  const editAndResendMessage = useCallback((messageId: string, newContent: string) => {
    return handleMessage('editAndResend', { messageId, newContent });
  }, [handleMessage]);


  return {
    sendMessage,
    cancelStream,
    regenerateMessage,
    editAndResendMessage,
    // 뮤테이션 상태
    isSending: messageMutation.isPending && messageMutation.variables?.type === 'send',
    isRegenerating: messageMutation.isPending && messageMutation.variables?.type === 'regenerate',
    isEditing: messageMutation.isPending && messageMutation.variables?.type === 'editAndResend',
    isStreaming: messageMutation.isPending,
  };
}