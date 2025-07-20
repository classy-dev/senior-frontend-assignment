import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { OpenAIService } from '@/services/openaiService';
import { useChatStore } from '@/store/chatStore';
import { ContentType } from '@/types/chat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { errorHandler } from '@/utils/errorHandling';

type MessageMutationType = 'send' | 'regenerate' | 'editAndResend';

interface MessageMutationVariables {
  type: MessageMutationType;
  content?: string; // for send
  messageId?: string; // for regenerate and editAndResend
  newContent?: string; // for editAndResend
  contentType: ContentType;
  assistantMessageId: string;
}

export function useChatMutations() {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const {
    appendToStreamingMessage,
    updateMessage,
    setStreamingId,
    setAbortController,
    getAbortController,
    saveCurrentChat,
  } = useChatStore();

  // 모든 메시지 작업을 위한 통합된 뮤테이션
  const messageMutation = useMutation({
    mutationFn: async ({ type, assistantMessageId }: MessageMutationVariables) => {
      if (!isOnline) {
        const errorMessages = {
          send: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
          regenerate: '오프라인 상태에서는 메시지를 재생성할 수 없습니다.',
          editAndResend: '오프라인 상태에서는 메시지를 수정하여 다시 보낼 수 없습니다.',
        };
        throw new Error(errorMessages[type]);
      }

      const controller = new AbortController();
      setAbortController(controller);
      setStreamingId(assistantMessageId);

      try {
        const currentMessages = useChatStore.getState().messages;
        const apiMessages: ChatCompletionMessageParam[] = (
          type === 'send'
            ? currentMessages.slice(0, -1)
            : currentMessages.filter(msg => msg.id !== assistantMessageId)
        ).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        await OpenAIService.createChatStream({
          messages: apiMessages,
          signal: controller.signal,
          onChunk: (chunk, contentType) => {
            appendToStreamingMessage(assistantMessageId, chunk);
            
            // contentType이 처음 감지되면 업데이트
            if (contentType) {
              const message = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
              if (message && message.contentType === 'text') {
                updateMessage(assistantMessageId, { contentType: contentType as ContentType });
              }
            }
          },
          onError: (error) => {
            // OpenAIService에서 처리하지 못한 에러를 받아서 다시 던짐
            throw error;
          },
          onComplete: () => {
            updateMessage(assistantMessageId, { isStreaming: false });
            setStreamingId(null);
            // 스트리밍 완료 후 자동 저장
            setTimeout(() => {
              saveCurrentChat();
              queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
            }, 100);
          },
        });
      } finally {
        // 메모리 누수를 방지하기 위해 AbortController를 즉시 정리
        setAbortController(null);
        
        // finally 블록에서 스트리밍 상태를 확실히 정리
        const currentStreamingId = useChatStore.getState().currentStreamingId;
        if (currentStreamingId === assistantMessageId) {
          updateMessage(assistantMessageId, { isStreaming: false });
          setStreamingId(null);
        }
      }
    },
    onError: (error, variables) => {
      const message = useChatStore.getState().messages.find(m => m.id === variables.assistantMessageId);
      if (message && !message.content) {
        useChatStore.getState().deleteMessage(variables.assistantMessageId);
      } else if (message) {
        updateMessage(variables.assistantMessageId, { isStreaming: false });
      }
      setStreamingId(null);
      
      // 중앙 집중식 오류 처리기 사용
      errorHandler.handle(error, `ChatMutation:${variables.type}`);
    },
  });

  // 스트림 취소 함수
  const cancelStream = () => {
    const controller = getAbortController();
    const streamingId = useChatStore.getState().currentStreamingId;
    
    // 컨트롤러가 있고 스트리밍 중인 경우에만 처리
    if (controller && streamingId) {
      // 먼저 abort 신호를 보냄
      controller.abort();
      
      // race condition 방지를 위해 setTimeout으로 약간의 지연 후 상태 정리
      setTimeout(() => {
        const currentStreamingId = useChatStore.getState().currentStreamingId;
        
        // 여전히 같은 메시지가 스트리밍 중인 경우에만 처리
        if (currentStreamingId === streamingId) {
          const message = useChatStore.getState().messages.find(m => m.id === streamingId);
          
          if (message && !message.content) {
            // 내용이 없는 메시지는 삭제
            useChatStore.getState().deleteMessage(streamingId);
          }
          // finally 블록에서 isStreaming과 streamingId 정리를 처리하므로 여기서는 생략
        }
      }, 100);
    }
  };

  return {
    messageMutation,
    cancelStream,
  };
}