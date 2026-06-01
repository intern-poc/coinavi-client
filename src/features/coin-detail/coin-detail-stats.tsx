import type { CoinDetail } from '@/types/coin';
import {
  changeColor,
  formatLargePrice,
  formatPercent,
  type DisplayCurrency,
} from '@/lib/format';

/**
 * 단건 페이지 통계 grid — 시총·24h 거래량·유통 공급량·7d 변동률·마지막 동기화 시각.
 *
 * <p>{@code circulatingSupply} 는 통화 무관 (코인 개수). KRW/USD 토글 영향 X.
 * formatLargePrice 는 통화 단위 값에만 사용 — supply 는 별도 포맷.
 */
export function CoinDetailStats({
  coin,
  currency,
}: {
  coin: CoinDetail;
  currency: DisplayCurrency;
}) {
  const lastSynced = formatRelative(coin.lastSyncedAt);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Stat label="시가총액" value={formatLargePrice(coin.marketCap, currency)} />
      <Stat label="24h 거래량" value={formatLargePrice(coin.volume24h, currency)} />
      <Stat
        label="유통 공급량"
        value={
          coin.circulatingSupply != null
            ? `${coin.circulatingSupply.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} ${coin.symbol}`
            : '-'
        }
      />
      <Stat
        label="7d 변동률"
        value={formatPercent(coin.priceChange7d)}
        valueClass={`font-mono ${changeColor(coin.priceChange7d)}`}
      />
      <Stat label="마지막 동기화" value={lastSynced} valueClass="text-sm text-zinc-500" />
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      <div className={valueClass ?? 'text-base font-medium text-zinc-900 dark:text-zinc-50'}>
        {value}
      </div>
    </div>
  );
}

/**
 * lastSyncedAt 같은 ISO 시각을 "n분 전" 형식으로 변환.
 * 1분 미만 → "방금", 60분 미만 → "n분 전", 24시간 미만 → "n시간 전", 그 외 날짜.
 */
function formatRelative(iso: string): string {
  if (!iso) return '-';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '-';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '방금';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}
