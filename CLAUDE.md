# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Coinavi 프론트엔드 — Next.js 16 App Router + React 19 + Tailwind CSS 4. [coinavi-server](https://github.com/intern-poc/coinavi-server) 와 통신.

## 협업 원칙 (Karpathy LLM Coding Pitfalls)

> *"The models make wrong assumptions on your behalf and just run along with them without checking. They don't manage their confusion, don't seek clarifications, don't surface inconsistencies, don't present tradeoffs, don't push back when they should."*

LLM 이 가장 자주 빠지는 네 가지 함정. 매 작업마다 점검.

### 1. Don't assume — 가정하지 말 것

- 사용자 의도·요구사항이 불명확하면 **추측 후 진행 X**. 짧게라도 확인 질문 우선
- API 응답 스키마 모르면 **코드 작성 전에 백엔드 DTO 확인**
- "X 해줘" 가 두 가지로 해석 가능하면 둘 다 제시 후 결정

### 2. Don't hide confusion — 혼동 숨기지 말 것

- 컴포넌트 의도 모호하면 *git log* 로 도입 PR 찾아 맥락 파악. 그래도 안 잡히면 질문
- React 패턴 (RSC vs Client, hooks 순서, useEffect deps 등) 헷갈리면 가정 X, 확인 우선

### 3. Surface tradeoffs — 트레이드오프 노출

- 라이브러리 선택 / state 관리 / API 호출 방식 등 결정 시 2~3 옵션 + 추천 제시
- 디자인 의사결정은 ASCII wireframe 또는 옵션 비교로 사용자 선택 받기

### 4. Goal-driven execution — 선언적 목표 + 검증

- 작업 시작 전 검증 기준 명시 (예: 빈 상태·로그인·KRW/USD 토글·다크모드 모두 동작)
- 코드 작성 후 검증 단계 — `npx tsc --noEmit` (타입) + `npm run lint` + 사용자 **브라우저 직접 확인**까지가 종료
- 사용자 "OK" 받기 전 commit X

### 추가 — 이 프로젝트 특유 규약

- **단계마다 사용자 확인** — 새 라우트·새 컴포넌트·새 라이브러리 도입 전 한 번 더 확인
- **사용자 브라우저 검증 = 최종 게이트** — 타입 체크 통과해도 사용자가 직접 보고 OK 줘야 commit

## 빌드 & 실행

```bash
npm install
cp .env.example .env.local
# .env.local 에 NEXT_PUBLIC_API_BASE_URL 편집 (기본 http://localhost:8080)
npm run dev          # 개발 서버 (Turbopack), http://localhost:3000
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npx tsc --noEmit     # 타입 체크만 (빌드 안 함)
```

## 아키텍처

### 라우트 (App Router)

| 경로 | 인증 | 컴포넌트 종류 |
| --- | --- | --- |
| `/` | 공개 | Server (initial fetch) + Client (CoinTable SSE) |
| `/coins/[identifier]` | 공개 | Server (detail + chart 병렬 fetch) + Client (CoinDetailChart) |
| `/portfolio` | 필요 | Server shell + Client (auth + fetch + polling) |
| `/exchange-keys` | 필요 | Server shell + Client |
| `/login` | 공개 | Client (OAuth) |

### 디렉토리 구조

- `src/app/` — Next.js App Router 라우트
- `src/components/` — 공용 UI (Header, BackButton, Tooltip, CurrencyToggle, ThemeToggle)
- `src/features/` — 기능 단위 모듈 (auth, coins, coin-detail, exchange-keys, portfolio)
- `src/lib/` — api 클라이언트, format, auth 헬퍼
- `src/types/` — 도메인 타입 (백엔드 DTO 와 1:1)

### Server Component vs Client Component

- **페이지 shell 은 Server Component** — initial fetch + 정적 레이아웃
- **인터랙션 / 훅 / 차트 라이브러리는 Client Component** (`'use client'`)
- 패턴: `app/foo/page.tsx` (Server) 가 `features/foo/foo-client.tsx` (Client) 에 initial data 주입

### URL state 패턴

`currency` / `range` / `page` 등 사용자 토글 가능한 상태는 **URL 쿼리 스트링에 동기화**. 이유:
- 새로고침 시 상태 유지
- 다른 사람과 URL 공유 가능
- Server Component 가 같은 쿼리로 다시 fetch → 일관됨

토글 컴포넌트 (`CurrencyToggle`) 가 `router.push(`?currency=USD`)` 하면 Server Component 가 re-render.

### API 호출

- `lib/api.ts` 의 `api.get / post / put / delete` 사용
- `CommonResponse<T>` 자동 unwrap (실패 시 throw)
- **401 자동 silent refresh** — refresh token httpOnly cookie 로 새 access token 받아 재시도
- 인증 안 필요한 호출은 `{ authenticated: false }` 옵션

### 인증

- Google OAuth → ID Token 백엔드 검증 → 자체 JWT 발급
- access token 메모리 저장 (`lib/auth.ts`), refresh token httpOnly cookie
- `useAuth` 훅: `{ status: 'loading' | 'authenticated' | 'unauthenticated', user, logout }`
- AuthProvider 가 mount 시 silent refresh 시도

## 코드 컨벤션

### 색상 — 한국 거래소 컨벤션

- 양수(상승) → **빨강** (`text-red-500 dark:text-red-400`)
- 음수(하락) → **파랑** (`text-blue-500 dark:text-blue-400`)
- null/0 → 회색 (`text-zinc-500`)

→ `lib/format.ts` 의 `changeColor()` 헬퍼로 일관 적용. 미국 거래소 컨벤션 (반대) 와 다름 — 사용자 한국임을 가정.

### 가격 표시

- `formatPrice(value, currency)` — KRW 동적 자릿수 (≥100원 정수, ≥1원 2자리, ≥0.01원 4자리, 그 외 8자리). USD 는 <1일 때 6자리, 그 외 2자리
- `formatLargePrice(value, currency)` — 시총·거래량 압축 (조원/억원/만원)
- `formatPercent(value)` — 부호 포함 (`+1.23%` / `-0.45%`)

밈코인 (시바이누 등) 도 정수 절삭 X — 동적 자릿수 정책.

### 테이블 jitter 방지

SSE 갱신마다 셀 값 길이가 바뀌면 (`+0.02%` ↔ `-12.34%`) `table-layout: auto` 가 컬럼 너비 재계산해 출렁임. 해결:

```jsx
<table className="w-full table-fixed">
  <colgroup>
    <col className="w-12" />
    <col />  {/* flex */}
    <col className="w-40" />
    ...
  </colgroup>
  ...
</table>
```

→ `colgroup` 한 곳에서 컬럼 너비 정의. `coin-table.tsx` 의 핵심 패턴.

### 뒤로가기 BackButton

`history.length > 1` 시 `router.back()`, 아니면 `fallback` URL. 새 탭으로 직접 진입한 사용자도 갇히지 않음. `app/.../page.tsx` 들에서 단일 `<BackButton />` 만 사용 — 단건 페이지처럼 currency 모드 유지해야 하면 `fallback="/?currency=USD"`.

### 차트 라이브러리

**recharts** 사용. 외부 인터페이스는 도메인 DTO (`CoinChart`, `PortfolioCoinHolding`) 만 의존 → 추후 lightweight-charts 등으로 교체 시 컴포넌트 내부만 수정.

### 다크 / 라이트

Tailwind `dark:` 클래스 활용. `theme-toggle.tsx` 가 `document.documentElement.classList` 토글.

## 진행 방향 (2026-05 회의 기준)

기능 개발은 1차 마무리 단계. 프론트 다음 우선순위 — 상세는 README 「향후 로드맵」 참조:

1. **매매일지 화면** — 거래 내역 리스트 + 메모
2. **자산 추이 차트** — 일/주/월/년 자산 변화
3. **고래 추적 페이지** — 지갑 이벤트 타임라인
4. **거래소 추가 UI** — 국내 거래소 + 코인베이스 OAuth
5. **배포** — 백엔드 GCP 배포에 맞춰 프론트 배포
6. **AI 코멘트** (이후)

## 브랜치 전략

- `main` — 배포 (직접 커밋 금지)
- `develop` — 개발 기본 (PR base)
- `feature/*`, `fix/*` — 작업 브랜치
- 머지 대상은 항상 `develop`
