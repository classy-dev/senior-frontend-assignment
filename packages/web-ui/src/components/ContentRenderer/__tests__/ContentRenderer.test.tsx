import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { ContentRenderer } from '../ContentRenderer';

// 개별 렌더러 모의
vi.mock('../MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-renderer">{content}</div>
}));

vi.mock('../HTMLRenderer', () => ({
  HTMLRenderer: ({ content }: { content: string }) => <div data-testid="html-renderer">{content}</div>
}));

vi.mock('../JSONRenderer', () => ({
  JSONRenderer: ({ content }: { content: string }) => <div data-testid="json-renderer">{content}</div>
}));

vi.mock('../TextRenderer', () => ({
  TextRenderer: ({ content }: { content: string }) => <div data-testid="text-renderer">{content}</div>
}));

describe('ContentRenderer 컴포넌트', () => {
  it('마크다운 콘텐츠를 올바르게 렌더링해야 함', () => {
    const content = '# 제목\n\n본문 내용';
    render(<ContentRenderer content={content} contentType="markdown" />);
    
    expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    // 모킹된 컴포넌트가 content를 그대로 렌더링하므로 정규화된 텍스트로 비교
    expect(screen.getByTestId('markdown-renderer').textContent).toBe(content);
  });

  it('HTML 콘텐츠를 올바르게 렌더링해야 함', () => {
    const content = '<div>HTML 콘텐츠</div>';
    render(<ContentRenderer content={content} contentType="html" />);
    
    expect(screen.getByTestId('html-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('html-renderer')).toHaveTextContent(content);
  });

  it('JSON 콘텐츠를 올바르게 렌더링해야 함', () => {
    const content = '{"name": "테스트"}';
    render(<ContentRenderer content={content} contentType="json" />);
    
    expect(screen.getByTestId('json-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('json-renderer')).toHaveTextContent(content);
  });

  it('텍스트 콘텐츠를 올바르게 렌더링해야 함', () => {
    const content = '일반 텍스트 메시지';
    render(<ContentRenderer content={content} contentType="text" />);
    
    expect(screen.getByTestId('text-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('text-renderer')).toHaveTextContent(content);
  });

  it('알 수 없는 콘텐츠 타입은 텍스트로 렌더링해야 함', () => {
    const content = '알 수 없는 타입';
    render(<ContentRenderer content={content} contentType={'unknown' as any} />);
    
    expect(screen.getByTestId('text-renderer')).toBeInTheDocument();
  });
});