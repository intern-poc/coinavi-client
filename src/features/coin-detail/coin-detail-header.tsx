import type { CoinDetail } from '@/types/coin';
import {
  changeColor,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from '@/lib/format';

/**
 * 단건 페이지 상단 hero — 이미지·이름·심볼·시총 순위·현재가·24h 변동률.
 *
 * <p>SSR 시점의 정적 스냅샷. 실시간 갱신은 1차 범위 X (시세 페이지 SSE 와 통합 시 추후 도입).
 */
export function CoinDetailHeader({
  coin,
  currency,
}: {
  coin: CoinDetail;
  currency: DisplayCurrency;
}) {
  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div className="flex items-center gap-4">
        {coin.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coin.imageUrl}
            alt={coin.symbol}
            width={56}
            height={56}
            className="rounded-full"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {coin.name ?? coin.symbol}
            </h1>
            <span className="text-sm text-zinc-500">{coin.symbol}</span>
            {coin.marketCapRank != null && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                #{coin.marketCapRank}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
          {formatPrice(coin.currentPrice, currency)}
        </div>
        <div className={`text-sm font-mono mt-1 ${changeColor(coin.priceChange24h)}`}>
          {formatPercent(coin.priceChange24h)}
          <span className="text-zinc-500 ml-2">24h</span>
        </div>
      </div>
    </div>
  );
}
