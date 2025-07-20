import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { MessageBubble } from '../MessageBubble';
import { Message } from '@/types/chat';

// ContentRenderer 모의
vi.mock('@/components/ContentRenderer/ContentRenderer', () => ({
  ContentRenderer: ({ content, contentType }: { content: string; contentType: string }) => (
    <div data-testid="content-renderer" data-content-type={contentType}>{content}</div>
  ),
}));

// useChatStore 모의
vi.mock('@/store/chatStore', () => ({
  useChatStore: vi.fn((selector) => {
    const mockState = { messages: [{ id: 'msg-1' }, { id: 'msg-2' }] };
    return selector ? selector(mockState) : mockState;
  }),
}));

describe('MessageBubble 컴포넌트', () => {
  const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'test-msg-1',
    role: 'user',
    content: '테스트 메시지',
    contentType: 'text',
    timestamp: new Date('2024-01-01T12:00:00'),
    ...overrides,
  });

  it('사용자 메시지를 올바르게 렌더링해야 함', () => {
    const message = createMockMessage({ role: 'user' });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('U')).toBeInTheDocument();
    expect(screen.getByTestId('content-renderer')).toHaveTextContent('테스트 메시지');
    expect(screen.getByText('편집')).toBeInTheDocument();
  });

  it('AI 메시지를 올바르게 렌더링해야 함', () => {
    const message = createMockMessage({ 
      role: 'assistant',
      content: 'AI 응답',
      contentType: 'markdown'
    });
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByTestId('content-renderer')).toHaveTextContent('AI 응답');
    expect(screen.getByTestId('content-renderer')).toHaveAttribute('data-content-type', 'markdown');
    expect(screen.getByText('재생성')).toBeInTheDocument();
  });

  it('메시지 시간을 올바른 형식으로 표시해야 함', () => {
    const message = createMockMessage();
    render(<MessageBubble message={message} />);
    
    expect(screen.getByText('오후 12:00')).toBeInTheDocument();
  });

  it('스트리밍 중일 때 타이핑 인디케이터를 표시해야 함', () => {
    const message = createMockMessage({ isStreaming: true });
    const { container } = render(<MessageBubble message={message} />);
    
    const typingIndicator = container.querySelector('.animate-typing');
    expect(typingIndicator).toBeInTheDocument();
    expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
  });

  it('사용자 메시지 편집 모드로 전환되어야 함', () => {
    const message = createMockMessage({ role: 'user' });
    render(<MessageBubble message={message} />);
    
    const editButton = screen.getByRole('button', { name: '메시지 편집' });
    fireEvent.click(editButton);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('테스트 메시지');
    expect(screen.getByText('취소')).toBeInTheDocument();
    expect(screen.getByText('보내기')).toBeInTheDocument();
  });

  it('편집 취소 시 원래 상태로 돌아가야 함', () => {
    const message = createMockMessage({ role: 'user' });
    render(<MessageBubble message={message} />);
    
    // 편집 모드로 전환
    fireEvent.click(screen.getByRole('button', { name: '메시지 편집' }));
    
    // 내용 변경
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '변경된 내용' } });
    
    // 취소
    fireEvent.click(screen.getByText('취소'));
    
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByTestId('content-renderer')).toHaveTextContent('테스트 메시지');
  });

  it('편집된 메시지를 저장하고 콜백을 호출해야 함', () => {
    const onEditAndResend = vi.fn();
    const message = createMockMessage({ role: 'user' });
    render(<MessageBubble message={message} onEditAndResend={onEditAndResend} />);
    
    // 편집 모드로 전환
    fireEvent.click(screen.getByRole('button', { name: '메시지 편집' }));
    
    // 내용 변경
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '수정된 메시지' } });
    
    // 저장
    fireEvent.click(screen.getByText('보내기'));
    
    expect(onEditAndResend).toHaveBeenCalledWith('test-msg-1', '수정된 메시지');
  });

 

  it('AI 메시지 재생성 버튼이 콜백을 호출해야 함', () => {
    const onRegenerate = vi.fn();
    const message = createMockMessage({ role: 'assistant' });
    render(<MessageBubble message={message} onRegenerate={onRegenerate} />);
    
    fireEvent.click(screen.getByRole('button', { name: '응답 재생성' }));
    
    expect(onRegenerate).toHaveBeenCalledWith('test-msg-1');
  });

  it('스트리밍 중일 때는 편집/재생성 버튼이 표시되지 않아야 함', () => {
    const message = createMockMessage({ isStreaming: true });
    render(<MessageBubble message={message} />);
    
    expect(screen.queryByText('편집')).not.toBeInTheDocument();
    expect(screen.queryByText('재생성')).not.toBeInTheDocument();
  });

 

  it('사용자와 AI 메시지의 스타일이 다르게 적용되어야 함', () => {
    const userMessage = createMockMessage({ role: 'user' });
    const { container: userContainer } = render(<MessageBubble message={userMessage} />);
    
    const userBubble = userContainer.querySelector('.bg-chat-user');
    expect(userBubble).toBeInTheDocument();
    
    const aiMessage = createMockMessage({ role: 'assistant' });
    const { container: aiContainer } = render(<MessageBubble message={aiMessage} />);
    
    const aiBubble = aiContainer.querySelector('.bg-chat-ai');
    expect(aiBubble).toBeInTheDocument();
  });
});