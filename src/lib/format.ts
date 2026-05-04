/**
 * 화면 표시용 숫자 포맷터. 모두 null 안전 — null/undefined 면 '-' 반환.
 *
 * 한국 사용자 대상이라 ko-KR locale + 만/억/조 단위 + 단위는 뒤에 '원'.
 */

/**
 * 정확한 가격 표시 (코인 가격용).
 * 예: 113786000 → "113,786,000원"
 */
export function formatKrw(value: number | null | undefined): string {
  if (value == null) return '-';
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원`;
}

/**
 * 큰 금액 압축 표시 (시총·거래량용).
 * 예: 1234567890123 → "2,270.35조원" / 142298000000 → "1,422.98억원"
 */
export function formatLargeKrw(value: number | null | undefined): string {
  if (value == null) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}조원`;
  if (value >= 1e8) return `${(value / 1e8).toFixed(2)}억원`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(2)}만원`;
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`;
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
