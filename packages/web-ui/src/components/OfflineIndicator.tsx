import { memo } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import clsx from 'clsx';

export const OfflineIndicator = memo(() => {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed bottom-20 left-1/2 transform -translate-x-1/2',
        'px-4 py-2 rounded-full shadow-lg',
        'flex items-center gap-2 text-sm font-medium',
        'transition-all duration-300',
        !isOnline ? 'bg-red-600 dark:bg-red-700 text-white' : 'bg-yellow-500 dark:bg-yellow-600 text-white'
      )}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {!isOnline ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
      <span>
        {!isOnline 
          ? '오프라인 모드: 저장된 대화만 볼 수 있습니다.' 
          : `느린 연결 (${effectiveType})`}
      </span>
    </div>
  );
});