/**
 * 화면 표시용 숫자 포맷터. 모두 null 안전 — null/undefined 면 '-' 반환.
 *
 * 한국 사용자 대상이라 ko-KR locale 우선이지만 USD 토글 시 en-US locale + $ 단위.
 */

export type DisplayCurrency = 'KRW' | 'USD';

/**
 * 정확한 가격 표시 (코인 가격용).
 * KRW: 113786000 → "113,786,000원"  (1원 단위, 소수점 X — Upbit 도 정수 단위)
 * USD: 68000.50 → "$68,000.50", 0.000123 → "$0.000123"
 *
 * <p>KRW 가 정수인 이유: Upbit frame 자체가 1원/100원/1000원 단위 정수.
 * Binance USDT × fxRate 환산만 소수점 생기는데, 1초마다 자릿수가 늘어났다 줄었다 해서
 * 칸 폭 진동. 한국 거래소 컨벤션에 맞춰 1원 단위로 끊는 게 자연스러움.
 */
export function formatPrice(
  value: number | null | undefined,
  currency: DisplayCurrency
): string {
  if (value == null) return '-';
  if (currency === 'KRW') {
    return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`;
  }
  // USD: 1달러 미만의 알트는 소수점 4~6자리, 그 외엔 2자리.
  const digits = Math.abs(value) < 1 ? 6 : 2;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

/**
 * 큰 금액 압축 표시 (시총·거래량용).
 * KRW: 1234567890123 → "12.35조원" / 142298000000 → "1,422.98억원"
 * USD: 1.2e12 → "$1.20T" / 5e8 → "$500.00M"
 */
export function formatLargePrice(
  value: number | null | undefined,
  currency: DisplayCurrency
): string {
  if (value == null) return '-';
  if (currency === 'KRW') {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}조원`;
    if (value >= 1e8) return `${(value / 1e8).toFixed(2)}억원`;
    if (value >= 1e4) return `${(value / 1e4).toFixed(2)}만원`;
    return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`;
  }
  // USD T/B/M/K — 시총 표기 글로벌 컨벤션
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * 변동률 표시 + 부호. 예: 2.47 → "+2.47%", -1.23 → "-1.23%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 변동률 색상 클래스. 한국 거래소 컨벤션:
 * - 양수(상승) → 빨강
 * - 음수(하락) → 파랑
 * - null/0 → 회색
 *
 * <p>Upbit·Bithumb·Coinone 등 한국·아시아 거래소 표준. 미국 거래소(Coinbase 등) 는
 * 반대 (상승 초록 / 하락 빨강) 지만 우리는 한국 사용자 대상이라 한국 컨벤션.
 */
export function changeColor(value: number | null | undefined): string {
  if (value == null || value === 0) return 'text-zinc-500';
  return value > 0
    ? 'text-red-500 dark:text-red-400'
    : 'text-blue-500 dark:text-blue-400';
}
