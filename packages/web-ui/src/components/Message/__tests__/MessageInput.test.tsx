import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';

describe('MessageInput 컴포넌트', () => {
  const defaultProps = {
    onSendMessage: vi.fn(),
    isLoading: false,
    disabled: false,
  };



  it('텍스트 입력이 가능해야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('메시지를 입력하세요... (Shift+Enter로 줄바꿈)');
    await user.type(textarea, '안녕하세요');
    
    expect(textarea).toHaveValue('안녕하세요');
  });

  it('Enter 키로 메시지를 전송해야 함', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '테스트 메시지');
    await user.keyboard('{Enter}');
    
    expect(onSendMessage).toHaveBeenCalledWith('테스트 메시지');
    expect(textarea).toHaveValue('');
  });

  it('Shift+Enter로 줄바꿈이 가능해야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '첫 번째 줄');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, '두 번째 줄');
    
    expect(textarea).toHaveValue('첫 번째 줄\n두 번째 줄');
  });

  it('전송 버튼 클릭으로 메시지를 전송해야 함', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '버튼 테스트');
    
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });
    await user.click(sendButton);
    
    expect(onSendMessage).toHaveBeenCalledWith('버튼 테스트');
    expect(textarea).toHaveValue('');
  });

  it('빈 메시지는 전송되지 않아야 함', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   '); // 공백만 입력
    await user.keyboard('{Enter}');
    
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('disabled 상태에서는 입력과 전송이 불가능해야 함', () => {
    render(<MessageInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });
    
    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('로딩 중일 때 전송 버튼에 스피너가 표시되어야 함', () => {
    const { container } = render(<MessageInput {...defaultProps} isLoading={true} />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });
    expect(sendButton).toBeDisabled();
  });

  it('텍스트 길이가 표시되어야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '테스트');
    
    expect(screen.getByText('3 자')).toBeInTheDocument();
  });

  it('textarea가 내용에 맞게 자동으로 크기 조절되어야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    
    // 여러 줄의 텍스트 입력
    await user.type(textarea, '첫 번째 줄\n두 번째 줄\n세 번째 줄');
    
    // scrollHeight를 모의로 설정
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 80,
    });
    
    // input 이벤트 발생
    fireEvent.input(textarea);
    
    expect(textarea.style.height).toBe('80px');
  });

  it('최대 높이가 120px로 제한되어야 함', async () => {

    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    // scrollHeight를 120px 이상으로 설정
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 150,
    });
    
    fireEvent.input(textarea);
    
    expect(textarea.style.height).toBe('120px');
  });

  it('메시지 전송 후 textarea 높이가 초기화되어야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    // 여러 줄 입력
    await user.type(textarea, '여러\n줄의\n텍스트');
    
    // 높이 조정
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 80,
    });
    fireEvent.input(textarea);
    
    // 전송
    await user.keyboard('{Enter}');
    
    expect(textarea.style.height).toBe('auto');
  });

  it('포커스 상태에서 적절한 스타일이 적용되어야 함', async () => {
    const user = userEvent.setup();
    const { container } = render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const wrapper = container.querySelector('.focus-within\\:ring-2');
    
    await user.click(textarea);
    
    expect(wrapper).toHaveClass('focus-within:ring-2');
    expect(wrapper).toHaveClass('focus-within:ring-blue-500');
  });

  it('메시지가 없을 때 전송 버튼이 비활성화 스타일을 가져야 함', () => {
    render(<MessageInput {...defaultProps} />);
    
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });
    expect(sendButton).toHaveClass('bg-gray-100', 'text-gray-400');
  });

  it('메시지가 있을 때 전송 버튼이 활성화 스타일을 가져야 함', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '메시지');
    
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });
    expect(sendButton).toHaveClass('bg-gray-900', 'text-white');
    expect(sendButton).not.toBeDisabled();
  });
});