import { faker } from '@faker-js/faker';
import { generateFunctionCallArguments, generateToolCallArguments } from './fakeDataGenerators.js';
import { detectContentType, getContentSample } from './contentSamples.js';

export function createDefaultResponse(created, messages = []) {
  const contentType = detectContentType(messages);
  const content = getContentSample(contentType);
  
  return {
    choices: [
      {
        finish_reason: "stop",
        index: 0,
        message: {
          content,
          role: "assistant",
          contentType, // Add contentType to message
        },
        logprobs: null,
      },
    ],
    created: created,
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    model: `gpt-3.5-mock`,
    object: "chat.completion",
    usage: {
      completion_tokens: Math.floor(content.length / 4),
      prompt_tokens: 57,
      total_tokens: Math.floor(content.length / 4) + 57,
    },
  };
}

export function createFunctionCallingResponse(requestBody, created) {
  const isTool = Boolean(requestBody.tools);
  const functionOrToolCallObject = isTool
    ? [createToolCallObject(requestBody)]
    : createFunctionCallObject(requestBody);
  const functionOrToolCall = isTool ? "tool_calls" : "function_call";

  return {
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    object: "chat.completion",
    created: created,
    model: "gpt-3.5-mock",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          [functionOrToolCall]: functionOrToolCallObject,
        },
        finish_reason: functionOrToolCall,
      },
    ],
    usage: {
      prompt_tokens: 81,
      completion_tokens: 19,
      total_tokens: 100,
    },
  };
}

export function createToolCallObject(requestBody) {
  return {
    id: `call-${faker.string.alphanumeric(30)}`,
    type: "function",
    function: {
      name: `${requestBody.tools[0].function.name}`,
      arguments: `${generateToolCallArguments(requestBody)}`,
    },
  };
}

export function createFunctionCallObject(requestBody) {
  return {
    name: `${requestBody.functions[0].name}`,
    arguments: `${generateFunctionCallArguments(requestBody)}`,
  };
}

// 스트림별 상태 관리를 위한 Map
const streamStates = new Map();

export function getSteamChatObject(messages = [], isReset = false, streamId = null) {
  const created = Math.floor(Date.now() / 1000);
  
  // 스트림 ID가 없으면 새로 생성
  if (!streamId) {
    streamId = `chatcmpl-${faker.string.alphanumeric(30)}`;
  }

  // 새 스트림 시작 또는 리셋
  if (isReset || !streamStates.has(streamId)) {
    const contentType = detectContentType(messages);
    streamStates.set(streamId, {
      content: getContentSample(contentType),
      contentType, // Store contentType
      index: 0,
      id: streamId
    });
  }

  const streamState = streamStates.get(streamId);
  if (!streamState) {
    return JSON.stringify({
      id: streamId,
      object: 'chat.completion.chunk',
      created: created,
      model: "gpt-3.5-mock",
      choices: [{
        index: 0,
        delta: { content: '' },
        logprobs: null,
        finish_reason: "stop"
      }]
    });
  }

  // 현재 글자 반환
  const currentChar = streamState.content[streamState.index] || '';
  streamState.index++;

  // 스트림 완료 여부 확인
  const isFinished = streamState.index >= streamState.content.length;
  
  // 완료되면 상태 삭제
  if (isFinished) {
    streamStates.delete(streamId);
  }

  let ob = {
    id: streamId,
    object: 'chat.completion.chunk',
    created: created,
    model: "gpt-3.5-mock",
    system_fingerprint: null,
    choices: [
      {
        index: 0,
        delta: {
          content: currentChar,
          // Include contentType in first chunk or when finished
          ...(streamState.index === 1 || isFinished ? { contentType: streamState.contentType } : {})
        },
        logprobs: null,
        finish_reason: isFinished ? "stop" : null
      }
    ]
  }

  return JSON.stringify(ob);
}

// 스트림 정리 함수
export function cleanupStream(streamId) {
  if (streamId && streamStates.has(streamId)) {
    streamStates.delete(streamId);
  }
}