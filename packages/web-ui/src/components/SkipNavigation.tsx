export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-[100] focus:shadow-lg"
    >
      메인 콘텐츠로 건너뛰기
    </a>
  );
}