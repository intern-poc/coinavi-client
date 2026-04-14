# coinavi-client

Coinavi 프론트엔드 — 크립토 투자자 올인원 플랫폼 (통합 포트폴리오 · 고래 추적 · 생태계 분석 · AI 인사이트).

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- ESLint

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

개발 서버: http://localhost:3000

## Structure

```
src/
├── app/          # Next.js App Router (routes, layouts, pages)
├── components/   # 공용 컴포넌트 (UI primitives, layout)
├── features/     # 기능 단위 모듈 (portfolio, whale, ecosystem, insight, auth)
├── hooks/        # 공용 커스텀 훅
├── lib/          # 유틸, API 클라이언트, 상수
└── types/        # 공용 타입 정의
```

## Scripts

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run start` — 프로덕션 실행
- `npm run lint` — ESLint

## 향후 추가 예정
- PWA (Serwist)
- 상태관리 (Zustand)
- 서버 데이터 (@tanstack/react-query)
- UI 라이브러리 (shadcn/ui)
- 스키마 검증 (zod)
