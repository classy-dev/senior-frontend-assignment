import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus hook', () => {
  const originalNavigator = { ...navigator };
  
  beforeEach(() => {
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
  });

  afterEach(() => {
    // navigator 복원
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigator.onLine,
    });
  });

  it('초기 네트워크 상태를 올바르게 반환해야 함', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.rtt).toBe(50);
    expect(result.current.downlink).toBe(10);
  });

  it('오프라인 상태를 감지해야 함', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(false);
  });

  it('느린 연결을 감지해야 함 (slow-2g)', () => {
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: 'slow-2g',
        rtt: 600,
        downlink: 0.5,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isSlowConnection).toBe(true);
    expect(result.current.effectiveType).toBe('slow-2g');
  });

  it('느린 연결을 감지해야 함 (2g)', () => {
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        rtt: 300,
        downlink: 0.7,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('높은 RTT로 느린 연결을 감지해야 함', () => {
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        rtt: 600, // 500ms 이상
        downlink: 10,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('online 이벤트를 처리해야 함', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
    
    // online 이벤트 시뮬레이션
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOnline).toBe(true);
  });

  it('offline 이벤트를 처리해야 함', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    
    // offline 이벤트 시뮬레이션
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
  });

  it('connection change 이벤트를 처리해야 함', () => {
    const mockConnection = {
      effectiveType: '4g' as '4g' | '3g' | '2g' | 'slow-2g',
      rtt: 50,
      downlink: 10,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'connection', { value: mockConnection });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    // change 이벤트 리스너가 등록되었는지 확인
    expect(mockConnection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    // connection 변경 시뮬레이션
    const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
    
    act(() => {
      mockConnection.effectiveType = '2g';
      mockConnection.rtt = 300;
      changeHandler();
    });
    
    expect(result.current.effectiveType).toBe('2g');
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('connection이 없을 때도 동작해야 함', () => {
    Object.defineProperty(navigator, 'connection', { value: undefined });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.effectiveType).toBeUndefined();
    expect(result.current.rtt).toBeUndefined();
    expect(result.current.downlink).toBeUndefined();
  });

  it('언마운트 시 이벤트 리스너를 정리해야 함', () => {
    const mockConnection = {
      effectiveType: '4g' as '4g' | '3g' | '2g' | 'slow-2g',
      rtt: 50,
      downlink: 10,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'connection', { value: mockConnection });
    
    const { unmount } = renderHook(() => useNetworkStatus());
    
    unmount();
    
    // 이벤트 리스너가 제거되었는지 확인
    expect(mockConnection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

 
});