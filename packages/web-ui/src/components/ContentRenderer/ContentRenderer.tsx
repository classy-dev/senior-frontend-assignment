import { memo } from 'react';
import { ContentType } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HTMLRenderer } from './HTMLRenderer';
import { JSONRenderer } from './JSONRenderer';
import { TextRenderer } from './TextRenderer';

const contentRenderers = {
  markdown: MarkdownRenderer,
  html: HTMLRenderer,
  json: JSONRenderer,
  text: TextRenderer
} as const;

interface ContentRendererProps {
  content: string;
  contentType: ContentType;
  isStreaming?: boolean;
}

export const ContentRenderer = memo(({ content, contentType, isStreaming }: ContentRendererProps) => {
  const Renderer = contentRenderers[contentType] || contentRenderers.text;
  
  const needsBackground = contentType === 'markdown' || contentType === 'html';
  
  return (
    <div 
      data-testid="content-renderer"
      className={needsBackground ? 'relative rounded-xl p-5 -mx-2 bg-gray-100/90 dark:bg-gray-700/20 ring-1 ring-gray-300/50 dark:ring-gray-600/30 shadow-sm' : ''}
    >
      <div className="relative">
        <Renderer content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
});