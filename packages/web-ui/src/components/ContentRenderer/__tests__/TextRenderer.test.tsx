import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { TextRenderer } from '../TextRenderer';

describe('TextRenderer 컴포넌트', () => {
  it('일반 텍스트를 올바르게 렌더링해야 함', () => {
    const content = '안녕하세요. 이것은 일반 텍스트입니다.';
    render(<TextRenderer content={content} />);
    
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('줄바꿈을 올바르게 처리해야 함', () => {
    const content = '첫 번째 줄\n두 번째 줄\n세 번째 줄';
    const { container } = render(<TextRenderer content={content} />);
    
    const lines = container.querySelectorAll('.text-content > div');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveTextContent('첫 번째 줄');
    expect(lines[1]).toHaveTextContent('두 번째 줄');
    expect(lines[2]).toHaveTextContent('세 번째 줄');
  });

 
  it('여러 URL을 모두 링크로 변환해야 함', () => {
    const content = '사이트1: https://site1.com 그리고 사이트2: http://site2.net';
    render(<TextRenderer content={content} />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://site1.com');
    expect(links[1]).toHaveAttribute('href', 'http://site2.net');
  });

  it('빈 줄을 <br> 태그로 렌더링해야 함', () => {
    const content = '첫 번째 줄\n\n세 번째 줄';
    const { container } = render(<TextRenderer content={content} />);
    
    const lines = container.querySelectorAll('.text-content > div');
    expect(lines).toHaveLength(3);
    expect(lines[1].querySelector('br')).toBeInTheDocument();
  });

  it('공백 문자를 유지해야 함', () => {
    const content = '공백    여러개    포함';
    render(<TextRenderer content={content} />);
    
    expect(screen.getByText('공백 여러개 포함')).toBeInTheDocument();
  });

  it('특수 문자를 올바르게 표시해야 함', () => {
    const content = '특수문자: <>&"\'`';
    render(<TextRenderer content={content} />);
    
    expect(screen.getByText('특수문자: <>&"\'`')).toBeInTheDocument();
  });

  it('빈 콘텐츠를 처리해야 함', () => {
    const { container } = render(<TextRenderer content="" />);
    
    expect(container.querySelector('.text-content')).toBeInTheDocument();
    const lines = container.querySelectorAll('.text-content > div');
    expect(lines).toHaveLength(1);
    expect(lines[0].querySelector('br')).toBeInTheDocument();
  });

  it('URL이 한 줄에 여러 개 있을 때 모두 링크로 변환해야 함', () => {
    const content = 'https://first.com 텍스트 https://second.com 더 많은 텍스트 https://third.com';
    render(<TextRenderer content={content} />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    
    // 텍스트도 함께 표시되어야 함
    expect(screen.getByText(/텍스트/)).toBeInTheDocument();
    expect(screen.getByText(/더 많은 텍스트/)).toBeInTheDocument();
  });

  it('줄바꿈과 URL이 함께 있을 때 올바르게 처리해야 함', () => {
    const content = '첫 줄: https://line1.com\n두 번째 줄: https://line2.com';
    const { container } = render(<TextRenderer content={content} />);
    
    const lines = container.querySelectorAll('.text-content > div');
    expect(lines).toHaveLength(2);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('https://line1.com');
    expect(links[1]).toHaveTextContent('https://line2.com');
  });
});