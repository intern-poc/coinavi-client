'use client';

import { useState } from 'react';
import type { ExchangeCode } from '@/types/exchange-key';

/**
 * 거래소별 API 키 발급 가이드 — 1차는 텍스트 단계 + 공식 링크. 추후 스크린샷 (README 차별점).
 *
 * <p>거래소 탭 토글 — 사용자가 등록하려는 거래소 가이드만 펼쳐 본다.
 */
export function ExchangeKeyGuide() {
  const [tab, setTab] = useState<ExchangeCode>('UPBIT');

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
        API 키 만드는 방법
      </h2>

      <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
        <TabButton active={tab === 'UPBIT'} onClick={() => setTab('UPBIT')}>
          업비트
        </TabButton>
        <TabButton active={tab === 'BITHUMB'} onClick={() => setTab('BITHUMB')}>
          빗썸
        </TabButton>
        <TabButton active={tab === 'BINANCE'} onClick={() => setTab('BINANCE')}>
          바이낸스
        </TabButton>
      </div>

      {tab === 'UPBIT' && <UpbitGuide />}
      {tab === 'BITHUMB' && <BithumbGuide />}
      {tab === 'BINANCE' && <BinanceGuide />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const variant = active
    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-xs ${variant}`}>
      {children}
    </button>
  );
}

function UpbitGuide() {
  return (
    <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
      <li>업비트 웹사이트 로그인 → 우측 상단 프로필 → <b>Open API 관리</b></li>
      <li>
        <b>자산 조회</b> 권한만 체크.{' '}
        <span className="text-red-600 dark:text-red-400 font-medium">
          주문하기·출금하기는 절대 체크하지 마세요.
        </span>
      </li>
      <li>
        특정 IP 등록 — 본인 PC IP 또는 (배포 환경) 서버 IP. 모름이면 본인 PC IP 부터.
      </li>
      <li>2FA 확인 후 발급 — Access Key 와 Secret Key 둘 다 표시되는 화면에서 복사</li>
      <li>위 폼에 붙여넣기 → 등록</li>
      <li className="pt-1">
        공식 가이드:{' '}
        <a
          href="https://docs.upbit.com/docs/create-authorization-request"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          docs.upbit.com
        </a>
      </li>
    </ol>
  );
}

function BithumbGuide() {
  return (
    <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
      <li>빗썸 웹사이트 로그인 → 우측 상단 프로필 → <b>API 관리</b></li>
      <li>
        <b>새 API 발급</b> → 권한은 <b>잔고 조회</b> 만 체크.{' '}
        <span className="text-red-600 dark:text-red-400 font-medium">
          거래·출금 권한은 절대 체크하지 마세요.
        </span>
      </li>
      <li>
        등록 IP 입력 (선택) — 본인 PC IP 또는 서버 IP. 미입력 시 모든 IP 허용 (보안 약함).
      </li>
      <li>SMS / OTP 인증 → API Key 와 Secret Key 발급 화면에서 둘 다 복사</li>
      <li>
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          Secret 은 발급 직후 화면에만 표시
        </span>{' '}
        — 잃어버리면 재발급. 안전한 곳에 임시 저장 후 등록.
      </li>
      <li>위 폼에 붙여넣기 → 등록</li>
      <li className="pt-1">
        공식 가이드:{' '}
        <a
          href="https://apidocs.bithumb.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          apidocs.bithumb.com
        </a>
      </li>
    </ol>
  );
}

function BinanceGuide() {
  return (
    <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
      <li>Binance 로그인 → 우측 상단 프로필 → <b>Account → API Management</b></li>
      <li>Create API → System generated → 이름 입력 → 2FA 확인</li>
      <li>
        권한 설정: <b>Enable Reading</b> 만 체크.{' '}
        <span className="text-red-600 dark:text-red-400 font-medium">
          Spot/Futures Trading, Withdrawals 는 모두 해제하세요.
        </span>
      </li>
      <li>IP 제한 — Restrict to trusted IPs 권장 (본인 PC 또는 서버 IP)</li>
      <li>API Key 와 Secret Key 복사 (Secret 은 이때만 표시됨 — 잃어버리면 재발급)</li>
      <li>위 폼에 붙여넣기 → 등록</li>
      <li className="pt-1">
        공식 가이드:{' '}
        <a
          href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          binance.com support
        </a>
      </li>
    </ol>
  );
}
