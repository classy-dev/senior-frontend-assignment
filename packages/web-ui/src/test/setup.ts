import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// 테스트 후 자동 정리
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  server.resetHandlers();
});

// 전역 모의 설정
beforeAll(() => {
  server.listen();
  // IntersectionObserver 모의
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // ResizeObserver 모의
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // crypto.randomUUID 모의
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: vi.fn(() => `test-uuid-${Math.random().toString(36).substr(2, 9)}`),
    },
    writable: true,
    configurable: true,
  });

  // navigator.onLine 모의
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: true,
  });

  // navigator.connection 모의
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    configurable: true,
    value: {
      effectiveType: '4g',
      rtt: 50,
      downlink: 10,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });

  // URL.createObjectURL 모의
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // window.scrollTo 모의
  window.scrollTo = vi.fn();
  
  // HTMLElement.scrollIntoView 모의
  Element.prototype.scrollIntoView = vi.fn();

  // window.matchMedia 모의
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // 클립보드 API 모의
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });

  // Service Worker 모의
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      register: vi.fn().mockResolvedValue({}),
      ready: Promise.resolve({}),
    },
  });

  // localStorage 모킹 (테스트 환경에서 확실히 동작하도록)
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock.store[key];
    }),
    clear: vi.fn(() => {
      localStorageMock.store = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  // sessionStorage도 같은 방식으로 모킹
  const sessionStorageMock = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      sessionStorageMock.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete sessionStorageMock.store[key];
    }),
    clear: vi.fn(() => {
      sessionStorageMock.store = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});