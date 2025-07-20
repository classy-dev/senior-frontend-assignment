import { memo } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface MessageListProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
  onEditAndResend?: (messageId: string, newContent: string) => void;
}

export const MessageList = memo(({ messages, onRegenerate, onEditAndResend }: MessageListProps) => {
  // For small message lists, don't use virtualization
  if (messages.length < 50) {
    return (
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onRegenerate={onRegenerate}
            onEditAndResend={onEditAndResend}
          />
        ))}
      </div>
    );
  }

  // For large message lists, use virtualization
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageBubble 
        message={messages[index]} 
        onRegenerate={onRegenerate}
        onEditAndResend={onEditAndResend}
      />
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={messages.length}
          itemSize={120} // Estimated height of each message
          width={width}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
});