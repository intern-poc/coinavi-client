import Link from 'next/link';
import { fetchCategoryStats, fetchCategoryTopGainers } from './api';
import {
  changeColor,
  formatLargePrice,
  formatPercent,
  type DisplayCurrency,
} from '@/lib/format';

/**
 * 카테고리 통계 대시보드 — 시세 페이지(/) 칩 선택 시 + 카테고리 세부(/categories/[id]) 진입 시 표시.
 *
 * <p><b>3카드</b>:
 * <ol>
 *   <li>시가총액 + 24h 변동률</li>
 *   <li>24h 거래대금</li>
 *   <li>24h 상위 상승 종목 (top 3)</li>
 * </ol>
 *
 * <p><b>실패 graceful</b>: stats 404 + top-gainers 빈 list 둘 다인 경우만 dashboard 전체 hide.
 * 한쪽만 실패하면 가능한 정보 카드만 표시 — Promise.allSettled 로 독립 처리.
 *
 * <p>Server Component — 백엔드 fetch 결과를 SSR 으로 내려보냄. 클라 hydration 후 표시.
 */
export async function CategoryDashboard({
  categoryId,
  currency,
}: {
  categoryId: string;
  currency: DisplayCurrency;
}) {
  const [statsResult, gainersResult] = await Promise.allSettled([
    fetchCategoryStats(categoryId, currency),
    fetchCategoryTopGainers(categoryId, 3),
  ]);

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
  const topGainers = gainersResult.status === 'fulfilled' ? gainersResult.value : [];

  if (!stats && topGainers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats && (
        <>
          <Card title="시가총액">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatLargePrice(stats.marketCap, currency)}
            </div>
            <div className={`text-sm font-mono mt-1 ${changeColor(stats.marketCapChange24hPct)}`}>
              {formatPercent(stats.marketCapChange24hPct)} (24h)
            </div>
          </Card>

          <Card title="24h 거래대금">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatLargePrice(stats.volume24h, currency)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              카테고리 합산
            </div>
          </Card>
        </>
      )}

      {topGainers.length > 0 && (
        <Card title="24h 상위 상승">
          <ul className="space-y-1.5">
            {topGainers.map((g) => (
              <li key={g.symbol}>
                <Link
                  href={`/coins/${encodeURIComponent(g.coingeckoId ?? g.symbol)}?currency=${currency}`}
                  className="flex items-center justify-between gap-2 hover:underline"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {g.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.imageUrl}
                        alt={g.symbol}
                        width={18}
                        height={18}
                        className="rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {g.symbol}
                    </span>
                  </span>
                  <span className={`text-sm font-mono flex-shrink-0 ${changeColor(g.priceChange24hPct)}`}>
                    {formatPercent(g.priceChange24hPct)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{title}</div>
      {children}
    </div>
  );
}
