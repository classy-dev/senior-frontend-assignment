import { toast } from '@/store/toastStore';
import { useChatStore } from '@/store/chatStore';

export enum ErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError extends Error {
  type: ErrorType;
  retryable: boolean;
  statusCode?: number;
}

export function createAppError(
  message: string,
  type: ErrorType,
  retryable = false,
  statusCode?: number
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.retryable = retryable;
  error.statusCode = statusCode;
  return error;
}

export function parseError(error: unknown): AppError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // 네트워크 오류
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('failed')) {
      return createAppError(
        '네트워크 연결을 확인해주세요.',
        ErrorType.NETWORK,
        true
      );
    }
    
    // 속도 제한 오류
    if (message.includes('429') || message.includes('rate limit')) {
      return createAppError(
        '요청 속도 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
        ErrorType.RATE_LIMIT,
        true,
        429
      );
    }
    
    // 인증 오류
    if (message.includes('401') || message.includes('unauthorized')) {
      return createAppError(
        '인증에 실패했습니다. API 키를 확인해주세요.',
        ErrorType.AUTHENTICATION,
        false,
        401
      );
    }
    
    // 유효성 검사 오류
    if (message.includes('400') || message.includes('bad request')) {
      return createAppError(
        '잘못된 요청입니다. 입력 내용을 확인해주세요.',
        ErrorType.VALIDATION,
        false,
        400
      );
    }
    
    // 중단 오류 (실제 오류 아님)
    if (message.includes('abort')) {
      return createAppError(
        '요청이 취소되었습니다.',
        ErrorType.UNKNOWN,
        false
      );
    }
    
    // 기본 오류
    return createAppError(
      error.message || '알 수 없는 오류가 발생했습니다.',
      ErrorType.UNKNOWN,
      true
    );
  }
  
  return createAppError(
    '알 수 없는 오류가 발생했습니다.',
    ErrorType.UNKNOWN,
    true
  );
}

export function shouldRetry(error: unknown): boolean {
  const appError = parseError(error);
  return appError.retryable && appError.type !== ErrorType.UNKNOWN;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  handle(error: unknown, context?: string): void {
    const appError = parseError(error);
    
    // 중앙 집중식 로깅
    console.error(`[${context || 'Error'}]`, {
      type: appError.type,
      message: appError.message,
      retryable: appError.retryable,
      statusCode: appError.statusCode,
      originalError: error,
    });
    
    // 중단 오류에 대해서는 UI를 표시하지 않음
    if (appError.message.includes('취소')) {
      return;
    }
    
    // 오류 유형별 처리
    switch (appError.type) {
      case ErrorType.RATE_LIMIT:
        toast.warning(appError.message, 5000);
        break;
        
      case ErrorType.NETWORK:
        // 영구 표시를 위해 저장 (ErrorAlert에서)
        useChatStore.getState().setError(appError.message);
        break;
        
      case ErrorType.AUTHENTICATION:
        toast.error(appError.message, 0); // 인증 오류는 자동 해제 안 함
        break;
        
      case ErrorType.VALIDATION:
        toast.warning(appError.message);
        break;
        
      default:
        // 알 수 없는 오류의 경우, 일시적인 오류는 토스트로 표시
        // 심각한 오류는 영구 표시를 위해 저장
        if (appError.retryable) {
          toast.error(appError.message);
        } else {
          useChatStore.getState().setError(appError.message);
        }
    }
  }
  
  // 모든 오류를 지우는 메소드
  clearAll(): void {
    useChatStore.getState().setError(null);
  }
}

// 싱글톤 인스턴스 내보내기
export const errorHandler = ErrorHandler.getInstance();