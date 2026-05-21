'use client';

import type { ExchangeCode } from '@/types/exchange-key';

/**
 * 거래소별 API 키 발급 가이드 — 1차는 텍스트 단계 + 공식 링크. 추후 스크린샷 (README 차별점).
 *
 * <p>거래소 선택 state 는 상위({@link ExchangeKeysClient}) 에서 관리해 폼과 공유 — 가이드에서
 * 선택한 거래소가 곧 폼이 등록할 거래소. 사용자가 이중 선택 안 하도록.
 */
export function ExchangeKeyGuide({
  selected,
  onSelect,
}: {
  selected: ExchangeCode;
  onSelect: (exchange: ExchangeCode) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
        API 키 만드는 방법
      </h2>

      <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
        <TabButton active={selected === 'UPBIT'} onClick={() => onSelect('UPBIT')}>
          업비트
        </TabButton>
        <TabButton active={selected === 'BITHUMB'} onClick={() => onSelect('BITHUMB')}>
          빗썸
        </TabButton>
        <TabButton active={selected === 'BINANCE'} onClick={() => onSelect('BINANCE')}>
          바이낸스
        </TabButton>
      </div>

      {selected === 'UPBIT' && <UpbitGuide />}
      {selected === 'BITHUMB' && <BithumbGuide />}
      {selected === 'BINANCE' && <BinanceGuide />}
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
        <b>자산 조회</b> + <b>주문 조회</b> 권한 체크.{' '}
        <span className="text-red-600 dark:text-red-400 font-medium">
          주문하기·출금하기는 절대 체크하지 마세요.
        </span>
        <span className="block text-xs text-zinc-500 mt-0.5">
          자산 조회만으론 보유 자산만 보이고, 거래 내역·평단·손익 분석을 하려면 주문 조회도 필요합니다.
        </span>
      </li>
      <li>
        특정 IP 등록 — 본인 PC IP 또는 (배포 환경) 서버 IP. 모름이면 본인 PC IP 부터.
      </li>
      <li>2FA 확인 후 발급 — <b>Access Key</b> 와 <b>Secret Key</b> 둘 다 표시되는 화면에서 복사</li>
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
        <span className="text-red-600 dark:text-red-400 font-medium">반드시 「API 1.0」 탭</span>{' '}
        선택.
        <span className="block text-xs text-zinc-500 mt-0.5">
          코인아비는 빗썸 API 1.0 기준으로 연동돼 있어요. 2.0 키는 동작하지 않습니다.
        </span>
      </li>
      <li>
        <b>API 활성 항목</b> — <b>회원지갑정보</b> + <b>회원거래내역</b> 두 개 체크.{' '}
        <span className="text-red-600 dark:text-red-400 font-medium">
          거래취소·주문내역·매수/매도주문·가상자산 출금은 체크하지 마세요.
        </span>
        <span className="block text-xs text-zinc-500 mt-0.5">
          회원지갑정보 = 보유 자산, 회원거래내역 = 거래 내역(평단·손익 분석용).
        </span>
      </li>
      <li>SMS 인증 후 발급 → <b>Connect Key</b> 와 <b>Secret Key</b> 둘 다 복사</li>
      <li>
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          발급만으론 끝이 아님
        </span>{' '}
        — 「사용 중 API 리스트」에서 <b>활성화</b> 버튼을 눌러 SMS 인증 문자의 링크로 활성화까지 완료.
      </li>
      <li>
        <span className="block text-xs text-zinc-500">
          ⚠ 발급 후 7일 내 미활성화 또는 30일간 미사용 시 빗썸이 키를 자동 비활성화합니다.
        </span>
      </li>
      <li>위 폼에 Connect Key·Secret Key 붙여넣기 → 등록</li>
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
