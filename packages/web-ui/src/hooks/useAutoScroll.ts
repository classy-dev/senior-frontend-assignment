import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  threshold?: number; // 하단으로부터의 거리 (px)
  behavior?: ScrollBehavior;
}

export function useAutoScroll({ 
  threshold = 100, 
  behavior = 'smooth' 
}: UseAutoScrollOptions = {}) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 스크롤을 맨 아래로 이동
  const scrollToBottom = useCallback(() => {
    scrollEndRef.current?.scrollIntoView({ behavior });
  }, [behavior]);
  
  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsAtBottom(distanceFromBottom < threshold);
    };
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 체크
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);
  
  // IntersectionObserver로 스크롤 끝 요소 감지
  useEffect(() => {
    if (!scrollEndRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // 요소가 뷰포트에 보이면 하단에 있다고 판단
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observerRef.current.observe(scrollEndRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return {
    scrollEndRef,
    scrollToBottom,
    isAtBottom,
  };
}