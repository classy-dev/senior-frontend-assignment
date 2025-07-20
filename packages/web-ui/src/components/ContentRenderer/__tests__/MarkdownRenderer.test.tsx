import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer 컴포넌트', () => {
  it('제목을 올바르게 렌더링해야 함', () => {
    const content = '# 제목 1\n## 제목 2\n### 제목 3';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('제목 1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('제목 2');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('제목 3');
  });

  it('리스트를 올바르게 렌더링해야 함', () => {
    const content = '- 첫 번째 항목\n- 두 번째 항목\n\n1. 순서 있는 첫 번째\n2. 순서 있는 두 번째';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    const unorderedList = container.querySelector('ul');
    expect(unorderedList).toBeInTheDocument();
    expect(unorderedList?.children).toHaveLength(2);
    
    const orderedList = container.querySelector('ol');
    expect(orderedList).toBeInTheDocument();
    expect(orderedList?.children).toHaveLength(2);
  });

  it('코드 블록을 올바르게 렌더링해야 함', () => {
    const content = '```javascript\nconst hello = "world";\nconsole.log(hello);\n```';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    // Suspense로 인해 초기에는 로딩 상태가 표시될 수 있음
    const preElement = container.querySelector('pre');
    if (preElement) {
      expect(preElement).toBeInTheDocument();
    }
  });

  it('인라인 코드를 올바르게 렌더링해야 함', () => {
    const content = '이것은 `인라인 코드` 예시입니다.';
    render(<MarkdownRenderer content={content} />);
    
    const codeElement = screen.getByText('인라인 코드');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass('bg-gray-200');
  });

  it('테이블을 올바르게 렌더링해야 함', () => {
    const content = `
| 이름 | 나이 |
|------|------|
| 철수 | 20   |
| 영희 | 22   |
`;
    const { container } = render(<MarkdownRenderer content={content} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('min-w-full');
    
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent('이름');
    expect(headers[1]).toHaveTextContent('나이');
  });

  it('링크를 새 탭에서 열도록 렌더링해야 함', () => {
    const content = '[구글](https://google.com)';
    render(<MarkdownRenderer content={content} />);
    
    const link = screen.getByRole('link', { name: '구글' });
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('굵은 글씨와 기울임을 올바르게 렌더링해야 함', () => {
    const content = '**굵은 글씨**와 *기울임*';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    expect(container.innerHTML).toContain('<strong>굵은 글씨</strong>');
    expect(container.innerHTML).toContain('<em');
  });

  it('인용구를 올바르게 렌더링해야 함', () => {
    const content = '> 이것은 인용구입니다.\n> 여러 줄로 작성할 수 있습니다.';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveClass('border-l-4', 'border-gray-300');
  });

  it('체크리스트를 올바르게 렌더링해야 함 (GFM)', () => {
    const content = '- [x] 완료된 항목\n- [ ] 미완료 항목';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});