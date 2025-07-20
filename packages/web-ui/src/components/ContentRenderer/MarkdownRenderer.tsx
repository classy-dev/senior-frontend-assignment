import { memo, lazy, Suspense, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// 동적 import를 위한 lazy loading
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
);

interface MarkdownRendererProps {
  content: string;
}

// 스타일을 위한 타입 정의
type SyntaxStyle = Record<string, React.CSSProperties>;

// ReactMarkdown의 컴포넌트들을 외부 상수로 분리하여 재사용성 향상
const createMarkdownComponents = (syntaxStyle: SyntaxStyle | null): Components => ({
  code({ inline, className, children, ...props }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) {
    const match = /language-(\w+)/.exec(className || '');
    
    if (!inline && match) {
      return (
        <Suspense fallback={<pre className="bg-gray-900 dark:bg-gray-800 text-gray-300 dark:text-gray-200 p-4 rounded-md text-sm">로딩 중...</pre>}>
          <SyntaxHighlighter
            style={syntaxStyle || {}}
            language={match[1]}
            PreTag="pre"
            className="rounded-md"
            customStyle={{
              fontSize: '0.875rem',
              lineHeight: '1.5',
              padding: '1rem'
            }}
            {...props}
          >
            {children !== undefined ? String(children).replace(/\n$/, '') : ""}
          </SyntaxHighlighter>
        </Suspense>
      );
    }
    
    return (
      <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-base" {...props}>
        {children}
      </code>
    );
  },
  // 더 나은 스타일링을 위한 사용자 정의 테이블 렌더링
  table({ children }) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
        {children}
      </td>
    );
  },
  // 보안을 위한 사용자 정의 링크 렌더링
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
      >
        {children}
      </a>
    );
  },
  // 사용자 정의 목록 렌더링
  ul({ children }) {
    return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
  },
  // 사용자 정의 제목 렌더링 - prose 클래스와의 충돌 방지
  h1({ children }) {
    return <h1 className="text-2xl font-bold mt-4 mb-2 prose-h1:text-2xl">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xl font-bold mt-3 mb-2 prose-h2:text-xl">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-lg font-semibold mt-2 mb-1 prose-h3:text-lg">{children}</h3>;
  },
  // 사용자 정의 인용구
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-2 italic text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    );
  },
  // 사용자 정의 강조 렌더링
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
});

export const MarkdownRenderer = memo(({ content }: MarkdownRendererProps) => {
  const [syntaxStyle, setSyntaxStyle] = useState<SyntaxStyle | null>(null);
  
  // 스타일을 lazy load
  useEffect(() => {
    const loadStyle = async () => {
      try {
        const { oneDark } = await import('react-syntax-highlighter/dist/esm/styles/prism');
        setSyntaxStyle(oneDark as SyntaxStyle);
      } catch (error) {
        console.error('SyntaxHighlighter 스타일 로딩 실패:', error);
      }
    };
    
    // 코드 블록이 있을 때만 스타일 로드
    if (content.includes('```')) {
      loadStyle();
    }
  }, [content]);
  
  const markdownComponents = createMarkdownComponents(syntaxStyle);
  
  return (
    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none 
      prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2
      prose-li:marker:text-gray-900 dark:prose-li:marker:text-gray-300
      prose-ul:text-gray-700 dark:prose-ul:text-gray-300
      prose-ol:text-gray-700 dark:prose-ol:text-gray-300
      prose-p:text-gray-700 dark:prose-p:text-gray-300
      prose-headings:text-gray-900 dark:prose-headings:text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});