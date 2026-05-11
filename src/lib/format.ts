/**
 * 화면 표시용 숫자 포맷터. 모두 null 안전 — null/undefined 면 '-' 반환.
 *
 * 한국 사용자 대상이라 ko-KR locale 우선이지만 USD 토글 시 en-US locale + $ 단위.
 */

export type DisplayCurrency = 'KRW' | 'USD';

/**
 * 정확한 가격 표시 (코인 가격용).
 * KRW: 113786000 → "113,786,000원" / 0.0312 → "0.0312원" / 0.00001234 → "0.00001234원"
 * USD: 68000.50 → "$68,000.50" / 0.000123 → "$0.000123"
 *
 * <p>KRW 자릿수 동적 조절: 시바이누·페페 같은 밈코인은 Upbit 에서도 0.0xxx KRW 로 거래되므로
 * 정수 절삭 시 "0원" 으로 표시되어 정보 손실. 값 크기에 따라 4·8 자리까지 확장.
 * 자릿수가 변동하므로 호출 측에서 칸 너비를 명시 (table-fixed + colgroup) 해야 jitter 방지.
 */
export function formatPrice(
  value: number | null | undefined,
  currency: DisplayCurrency
): string {
  if (value == null) return '-';
  if (currency === 'KRW') {
    return `${value.toLocaleString('ko-KR', { maximumFractionDigits: krwDigits(value) })}원`;
  }
  // USD: 1달러 미만의 알트는 소수점 4~6자리, 그 외엔 2자리.
  const digits = Math.abs(value) < 1 ? 6 : 2;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

/**
 * KRW 표시용 소수점 자릿수. 값 크기에 비례한 유효 정밀도 확보.
 * - ≥ 100원: 정수 (메이저 코인)
 * - 1 ≤ x < 100원: 2자리 (도지·BTT 류)
 * - 0.01 ≤ x < 1원: 4자리 (시바이누 류)
 * - < 0.01원: 8자리 (페페 류 초저가)
 */
function krwDigits(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 100) return 0;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  return 8;
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
    // 만원 미만 — 시총·거래량에선 거의 안 나오지만 formatPrice 와 일관성 유지
    return `${value.toLocaleString('ko-KR', { maximumFractionDigits: krwDigits(value) })}원`;
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
