import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { JSONRenderer } from '../JSONRenderer';

// react-syntax-highlighter 모의
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  ),
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

describe('JSONRenderer 컴포넌트', () => {
  const validJSON = '{"name": "테스트", "age": 30, "skills": ["React", "TypeScript"]}';
  const invalidJSON = '{ invalid json }';

  it('유효한 JSON을 트리 뷰로 렌더링해야 함', () => {
    render(<JSONRenderer content={validJSON} />);
    
    expect(screen.getByText('JSON 데이터')).toBeInTheDocument();
    expect(screen.getByText('"name"')).toBeInTheDocument();
    expect(screen.getByText('"테스트"')).toBeInTheDocument();
    expect(screen.getByText('"age"')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('무효한 JSON에 대해 오류를 표시해야 함', () => {
    render(<JSONRenderer content={invalidJSON} />);
    
    expect(screen.getByText('JSON 파싱 오류')).toBeInTheDocument();
    expect(screen.getByText(invalidJSON)).toBeInTheDocument();
  });

  it('트리 뷰와 원본 뷰를 전환할 수 있어야 함', async () => {
    render(<JSONRenderer content={validJSON} />);
    
    const rawButton = screen.getByRole('button', { name: '원본' });
    fireEvent.click(rawButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    });
    
    const treeButton = screen.getByRole('button', { name: '트리 뷰' });
    fireEvent.click(treeButton);
    
    expect(screen.getByText('"name"')).toBeInTheDocument();
  });

  it('객체와 배열을 접고 펼 수 있어야 함', () => {
    render(<JSONRenderer content={validJSON} />);
    
    // skills 배열 찾기
    const skillsArray = screen.getByText('"skills"').parentElement;
    const toggleButton = skillsArray?.querySelector('button[aria-label*="배열"]');
    
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    
    // 배열 접기
    fireEvent.click(toggleButton!);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('...(2개 항목)')).toBeInTheDocument();
    
    // 배열 펼치기
    fireEvent.click(toggleButton!);
    expect(screen.getByText('"React"')).toBeInTheDocument();
    expect(screen.getByText('"TypeScript"')).toBeInTheDocument();
  });

  it('복사 버튼이 클립보드에 JSON을 복사해야 함', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });
    
    render(<JSONRenderer content={validJSON} />);
    
    const copyButton = screen.getByRole('button', { name: 'JSON 데이터 클립보드에 복사' });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(JSON.stringify(JSON.parse(validJSON), null, 2));
      expect(screen.getByText('복사됨!')).toBeInTheDocument();
    });
  });

  it('다양한 데이터 타입을 올바르게 표시해야 함', () => {
    const complexJSON = JSON.stringify({
      string: "문자열",
      number: 123,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: "value" }
    });
    
    render(<JSONRenderer content={complexJSON} />);
    
    expect(screen.getByText('"문자열"')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('중첩된 객체를 올바르게 렌더링해야 함', () => {
    const nestedJSON = JSON.stringify({
      level1: {
        level2: {
          level3: {
            value: "깊은 중첩"
          }
        }
      }
    });
    
    render(<JSONRenderer content={nestedJSON} />);
    
    expect(screen.getByText('"level1"')).toBeInTheDocument();
    expect(screen.getByText('"level2"')).toBeInTheDocument();
    expect(screen.getByText('"level3"')).toBeInTheDocument();
    expect(screen.getByText('"깊은 중첩"')).toBeInTheDocument();
  });

 

  it('스트리밍 중에도 JSON을 파싱해야 함', () => {
    const partialJSON = '{"name": "스트리밍 중"}';
    render(<JSONRenderer content={partialJSON} isStreaming={true} />);
    
    expect(screen.getByText('"name"')).toBeInTheDocument();
    expect(screen.getByText('"스트리밍 중"')).toBeInTheDocument();
  });

  it('접근성 속성이 올바르게 설정되어야 함', () => {
    render(<JSONRenderer content={validJSON} />);
    
    const toolbar = screen.getByRole('toolbar', { name: 'JSON 뷰어 도구' });
    expect(toolbar).toBeInTheDocument();
    
    const treeViewButton = screen.getByRole('button', { name: '트리 뷰' });
    expect(treeViewButton).toHaveAttribute('aria-pressed', 'true');
  });
});