# NextChapter WorkAI

![AI Chat Interface](./packages/web-ui/public/thumb.png)

## 🚀 라이브 데모
**<a href="https://senior-fronend-assignment.vercel.app/" target="_blank" rel="noopener noreferrer">https://senior-fronend-assignment.vercel.app/</a>**

실제 동작하는 애플리케이션을 직접 체험해보실 수 있습니다.

**📺 과제 설명 영상: <a href="https://www.youtube.com/watch?v=fi1SZugx8L4" target="_blank" rel="noopener noreferrer">YouTube에서 보기</a>**

필수구현과제와 도전과제에 대한 설명 및 데모 영상입니다.


## 프로젝트 개요

NextChapter WorkAI는 넥스트챕터 시니어 프론트엔드 개발자 채용 과제를 위해 개발된 AI 채팅 애플리케이션입니다. OpenAI Mock API를 활용하여 실시간 스트리밍 응답 처리, 다양한 콘텐츠 타입 렌더링, 오프라인 지원 등 프로덕션 수준의 채팅 인터페이스를 구현하였습니다. 

사용자 경험을 최우선으로 고려하여 설계되었으며, 실시간 스트리밍 응답, 다양한 콘텐츠 포맷 지원, 오프라인 모드 지원, 뛰어난 접근성을 제공합니다.




## 주요 특징

### 필수 구현 사항 ✅

#### 1. 채팅 UI
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 디바이스에서 완벽 지원
- **자동 스크롤링**: 새 메시지 도착 시 최하단 자동 스크롤
- 사용자와 AI의 구분되는 말풍선 디자인
- 메시지 입력 폼과 전송 기능

#### 2. 스트리밍 응답 처리
- **실시간 스트리밍 응답**: 글자별 점진적 렌더링으로 자연스러운 AI 대화 경험
- 스트리밍 중 취소 기능 (ESC 키)

#### 3. 콘텐츠 타입별 렌더링
- **다양한 콘텐츠 렌더링**: Markdown, HTML, JSON, 일반 텍스트 자동 감지 및 최적화 표시
- XSS 방지를 통한 안전한 HTML 렌더링
- 구조화된 JSON 데이터 시각화

#### 4. 에러 및 취소 처리
- 네트워크 오류 시 적절한 에러 메시지
- 자동 재시도 메커니즘 (Exponential backoff)

### 도전과제 구현 ✅

#### 1. 응답 편집/재생성
- **응답/재생성**: 수신된 AI 응답을 바꾸기 위해서, 사용자 메시지 수정 편집기능 제공 및 AI 응답 재생성 

* 응답 자체를 편집하는 기능을 추가할 수 있으나, 
  AI 에이전트에서 수신한 HTML 등 (FORM 요소)은 실제 프로덕션이라면, 
  수신한 목적 자체가 있다고 가정되기때문에, 이것을 편집할 수 있게 하는게 맞는지와 
  JSON 등의 경우에도 실제 서버에서 내려준 데이터를 사용자가 임의로 수정하여 데이터를 변경하게끔 하는게 맞는지등 정책고려사항이 있다 판단하여, 실질 응답된 내용을 편집하는 기능은 일단 제외

#### 2. 오프라인 모드
- **오프라인 우선 설계**: Service Worker 기반 PWA로 네트워크 없이도 사용 가능
- **PWA 설치**: 네이티브 앱처럼 설치 가능

#### 3. 채팅 히스토리
- **채팅 히스토리**: 대화 세션 관리, JSON/Markdown 내보내기
- **실시간 검색**: 채팅 히스토리 전체 텍스트 검색

#### 4. 성능 최적화
- **가상화**: 대량 메시지 처리를 위한 리스트 가상화
- 코드 스플리팅 및 메모이제이션
- Lighthouse Performance 94점 달성

#### 5. 접근성
- **접근성**: WCAG 2.1 AA 기준 충족
- **키보드 단축키**: 효율적인 작업을 위한 단축키 지원 (Ctrl/Cmd+K, Shift+ESC 등)
- 스크린 리더 최적화

#### 6. 사용자 경험 개선
- **다크 모드**: 시스템 설정 연동 및 수동 토글 지원
- 스크롤 버튼 및 키보드 내비게이션


## 기술 스택

### 프론트엔드 프레임워크
- **React 18.3** - 사용자 인터페이스 구축
- **TypeScript 5.5** - 정적 타입 시스템으로 안정성 확보
- **Vite 5.3** - 초고속 빌드 도구

### 상태 관리
- **Zustand 4.5** - 경량 전역 상태 관리
- **TanStack Query 5.62** - 서버 상태 관리 및 캐싱
- **LocalStorage** - 채팅 히스토리 영속성

### UI/UX
- **Tailwind CSS 3.4** - 유틸리티 기반 스타일링
- **React Window 1.8** - 대량 리스트 가상화
- **Lucide Icons** - 일관된 아이콘 시스템
- **DOMPurify 3.1** - 안전한 HTML 렌더링

### 콘텐츠 렌더링
- **React Markdown 9.0** - Markdown 파싱 및 렌더링
- **Remark GFM 4.0** - GitHub Flavored Markdown 지원
- **Prism React Renderer 2.3** - 구문 강조

### 개발 도구
- **Playwright 1.45** - E2E 테스트
- **Vitest 2.0** - 단위 테스트
- **MSW 2.10** - API 모킹
- **ESLint/Prettier** - 코드 품질 관리

## 프로젝트 구조

```
packages/web-ui/
├── public/                    # 정적 파일
│   ├── icon-*.png            # PWA 아이콘
│   ├── manifest.json         # PWA 매니페스트
│   ├── offline.html          # 오프라인 폴백 페이지
│   └── sw.js                 # Service Worker
├── src/                      # 소스 코드
│   ├── components/           # React 컴포넌트
│   │   ├── Chat/            # 채팅 관련 컴포넌트
│   │   ├── ContentRenderer/ # 콘텐츠 타입별 렌더러
│   │   ├── Message/         # 메시지 관련 컴포넌트
│   │   ├── ChatHistory/     # 채팅 히스토리
│   │   ├── Sidebar/         # 사이드바 네비게이션
│   │   └── Toast/           # 알림 시스템
│   ├── contexts/            # React Context
│   ├── hooks/               # Custom Hooks
│   ├── services/            # API 서비스
│   ├── store/              # Zustand 스토어
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   └── App.tsx             # 메인 애플리케이션
├── e2e/                     # E2E 테스트
├── test/                    # 테스트 설정
└── 설정 파일들              # 각종 설정 파일
```

## 주요 개발 특징

### 1. 실시간 스트리밍 처리
- OpenAI Mock API의 스트리밍 응답을 효율적으로 처리
- 청크 단위 렌더링으로 즉각적인 피드백 제공
- AbortController를 활용한 취소 기능
- 메모리 누수 방지를 위한 정확한 cleanup

### 2. 콘텐츠 타입 자동 감지
- 메시지 내용을 분석하여 최적의 렌더러 선택
- Markdown: 제목, 리스트, 코드블록, 테이블 지원
- HTML: XSS 방지와 함께 안전한 렌더링
- JSON: 구조화된 데이터 시각화
- 일반 텍스트: 기본 텍스트 표시

### 3. 오프라인 우선 아키텍처
- Service Worker로 정적 자산 캐싱
- 네트워크 상태 실시간 감지 및 표시
- PWA 설치 프롬프트 및 앱 라이프사이클 관리

### 4. 성능 최적화
- React Window를 활용한 대량 메시지 가상화
- 코드 스플리팅으로 초기 로딩 속도 개선
- 메모이제이션으로 불필요한 리렌더링 방지
- Lighthouse 성능 점수 94점 달성

### 5. 접근성 및 UX
- 완벽한 키보드 네비게이션
- 스크린 리더 최적화
- 시맨틱 HTML과 ARIA 레이블
- 포커스 관리 및 스킵 네비게이션

### 6. 채팅 히스토리 시스템
- LocalStorage 기반 영구 저장
- 세션별 대화 분류 및 타임스탬프
- 실시간 키워드 검색 (하이라이팅 포함)
- JSON/Markdown 형식 내보내기
- 세션 이름 변경 및 삭제 기능
- 새 채팅 시작 및 기존 대화 이어가기

### 7. 사용자 편의성
- **자동 스크롤링**: 새 메시지 도착 시 부드러운 스크롤 애니메이션
- **스크롤 버튼**: 수동 스크롤 시 하단 이동 버튼 표시
- **다크 모드**: 시스템 설정 자동 감지 및 토글 버튼
- **키보드 단축키**:
  - `Ctrl/Cmd + K`: 모바일에서 사이드바 열기
  - `Shift + ESC`: 메시지 입력창 포커스
  - `ESC`: 스트리밍 중단
  - `Enter`: 메시지 전송
  - `Shift + Enter`: 줄바꿈
- **히스토리 검색**: 실시간 검색 및 결과 하이라이팅

## 설치 및 실행 방법

### 요구 사항
- Node.js 18.0.0 이상
- pnpm 8.0.0 이상

### 설치

```bash
# 저장소 클론
git clone https://github.com/classy-dev/senior-frontend-assignment
cd senior-frontend-assignment

# 의존성 설치
pnpm install

# Mock 라이브러리 빌드 (필수)
cd packages/openai-api-mock
pnpm build
cd ../..


```

### 개발 모드 실행

```bash
# 개발 서버 실행 (Mock 서버 포함)
pnpm dev
```

### 테스트 실행

```bash
# Web UI로 이동
cd packages/web-ui

```

```bash
# 단위 테스트
pnpm test:unit

# E2E 테스트
pnpm test:e2e

# 테스트 커버리지
pnpm test:coverage
```

## 성과 및 기술적 도전

### 성능 지표
- **Lighthouse Performance**: 94점 (매우 우수!)
- **Accessibility**: 94점
- **Best Practices**: 96점
- **SEO**: 100점 
- **First Contentful Paint**: 0.9s (1초 미만으로 매우 빠름)
- **Largest Contentful Paint**: 1.0s
- **Total Blocking Time**: 160ms
- **Cumulative Layout Shift**: 0 (레이아웃 이동 없음 - 완벽!)
- **Speed Index**: 1.0s

### 해결한 기술
- **스트리밍 중 컴포넌트 언마운트**: AbortController와 cleanup 함수로 메모리 누수 방지
- **대용량 메시지 렌더링**: 가상화와 동적 높이 계산으로 성능 최적화
- **XSS 방지**: DOMPurify를 활용한 안전한 HTML 렌더링

### 비즈니스 가치
- **사용자 경험**: 즉각적인 피드백과 부드러운 인터렉션
- **신뢰성**: 네트워크 불안정 환경에서도 안정적 작동
- **접근성**: 모든 사용자가 동등하게 사용 가능
- **확장성**: 새로운 콘텐츠 타입 쉽게 추가 가능

## 향후 개선 계획

### 음성 인터페이스
- **Web Speech API 활용 STT/TTS**: 음성 입력 및 텍스트 읽기 기능

### 채팅 히스토리 보안 및 데이터 저장 개선
- **백엔드 API 연동**: 현재 LocalStorage 기반 채팅 히스토리를 서버 저장소로 이전
- **보안 취약성 해결**: LocalStorage의 XSS 공격 취약성 개선
- **오프라인 데이터베이스**: WebAssembly 기반 SQL.js를 활용한 클라이언트 사이드 구조화 저장
  - 더 안전한 데이터 암호화
  - 복잡한 쿼리 지원
  - 데이터 무결성 보장
  - 오프라인 동기화 메커니즘

## 요약

이 프로젝트는 넥스트챕터 시니어 프론트엔드 개발자 채용 과제로 개발된 프로덕션 수준의 AI 채팅 인터페이스입니다. React와 TypeScript를 기반으로 구축되었으며, 실시간 스트리밍, 다양한 콘텐츠 렌더링, 오프라인 지원 등의 요구사항을 충족합니다.