export type MessageRole = 'user' | 'assistant' | 'system';
export type ContentType = 'text' | 'markdown' | 'html' | 'json';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contentType?: ContentType;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  error: string | null;
  currentStreamingId: string | null;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}