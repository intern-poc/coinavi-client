'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchCoins } from './api';
import { CoinPagination } from './coin-pagination';
import type { Page } from '@/types/api';
import type { CoinSummary } from '@/types/coin';
import { changeColor, formatKrw, formatLargeKrw, formatPercent } from '@/lib/format';

/**
 * 코인 시세 테이블. 1초 polling 으로 실시간 갱신 + 가격 변동 flash.
 *
 * <p><b>Effect 1번만 mount 시 실행 — 핵심 패턴</b>:
 * 매 page 변경마다 useEffect 가 재생성되면 setInterval 이 매번 reset 되어
 * "1초 안에 응답 받으면 → setPage → effect 재생성 → 새 interval 1초 시작"
 * 패턴이 되어 polling 이 사실상 동작 안 한다. deps 빈 배열로 mount 시 1번만
 * 시작하고, 최신 page 정보는 ref 로 추적.
 *
 * <p><b>3중 캐시 방어</b>: lib/api.ts 에서 cache:'no-store' + Cache-Control 헤더 +
 * URL timestamp 쿼리. 브라우저·Next·프록시 어디든 stale 안 받음.
 *
 * <p><b>Flash 효과</b>: 이전 가격(useRef) 과 비교해 상승/하락 감지 → row 에
 * .price-flash-up / down class 부여 → CSS keyframe 800ms 후 자연 소멸.
 */
const POLL_INTERVAL_MS = 1_000;
const FLASH_DURATION_MS = 300;   // 거래소 찰나 깜빡 — 짧게.

type FlashDirection = 'up' | 'down';

export function CoinTable({ initialPage }: { initialPage: Page<CoinSummary> }) {
  const [page, setPage] = useState(initialPage);
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date());
  const [flashes, setFlashes] = useState<Map<number, FlashDirection>>(new Map());

  // 이전 가격 — 변경이 re-render 트리거 안 하게 ref.
  const prevPrices = useRef<Map<number, number>>(new Map());
  // 현재 페이지 정보 — effect 재실행 없이 latest 값 추적용.
  const pageInfoRef = useRef({ number: initialPage.number, size: initialPage.size });

  // initialPage 변경 시 (페이지 이동 등) state·ref 동기화.
  // 다른 페이지의 가격 비교는 의미 없으니 prevPrices clear 후 새로 채움.
  useEffect(() => {
    pageInfoRef.current = { number: initialPage.number, size: initialPage.size };
    setPage(initialPage);
    prevPrices.current.clear();
    initialPage.content.forEach((c) => {
      if (c.currentPrice != null) prevPrices.current.set(c.id, c.currentPrice);
    });
  }, [initialPage]);

  useEffect(() => {
    let cancelled = false;
    let flashTimeout: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const { number, size } = pageInfoRef.current;
        const next = await fetchCoins(number, size);
        if (cancelled) return;

        // 디버그 로그 — Network 탭 + console 에서 1초마다 가격 들어오는지 확인용.
        // 작동 확인 후 제거해도 됨.
        const btc = next.content.find((c) => c.symbol === 'BTC');
        if (btc) {
          console.log('[poll]', new Date().toLocaleTimeString('ko-KR'), 'BTC:', btc.currentPrice);
        }

        // 이전 가격과 비교해 변동 방향 감지.
        const newFlashes = new Map<number, FlashDirection>();
        next.content.forEach((coin) => {
          const prev = prevPrices.current.get(coin.id);
          if (prev != null && coin.currentPrice != null && coin.currentPrice !== prev) {
            newFlashes.set(coin.id, coin.currentPrice > prev ? 'up' : 'down');
          }
          if (coin.currentPrice != null) {
            prevPrices.current.set(coin.id, coin.currentPrice);
          }
        });

        setPage(next);
        pageInfoRef.current = { number: next.number, size: next.size };
        setUpdatedAt(new Date());
        setFlashes(newFlashes);

        if (flashTimeout) clearTimeout(flashTimeout);
        flashTimeout = setTimeout(() => {
          if (!cancelled) setFlashes(new Map());
        }, FLASH_DURATION_MS);
      } catch (e) {
        // polling 실패 silent — 다음 tick 에서 재시도.
        console.error('[CoinTable] poll failed', e);
      }
    }

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (flashTimeout) clearTimeout(flashTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← mount 시 1번만. 위 javadoc 참고.

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">암호화폐 시세</h2>
        <div className="flex items-baseline gap-3 text-sm text-zinc-500">
          {/* SSR 시점과 CSR 시점 시간이 달라 hydration mismatch 발생 — suppressHydrationWarning 으로 회피.
              CSR 마운트 후엔 매초 갱신되는 시각이라 어차피 server 값과 의미 다름. */}
          <span className="hidden sm:inline" suppressHydrationWarning>
            {updatedAt.toLocaleTimeString('ko-KR')} 기준
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-3 px-4 w-12">#</th>
              <th className="py-3 px-4">코인</th>
              <th className="py-3 px-4 text-right">현재가</th>
              <th className="py-3 px-4 text-right">24h</th>
              <th className="py-3 px-4 text-right">7d</th>
              <th className="py-3 px-4 text-right hidden md:table-cell">시가총액</th>
              <th className="py-3 px-4 text-right hidden lg:table-cell">거래량 (24h)</th>
            </tr>
          </thead>
          <tbody>
            {page.content.map((coin) => {
              const flash = flashes.get(coin.id);
              const flashClass =
                flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : '';
              // 시세 글자 색은 24h 변동률 부호 기준 (24h percent 색과 일치).
              // flash background 는 직전 1초 비교 결과 (별개) — 둘이 다를 수 있음.
              const priceColor = changeColor(coin.priceChange24h);
              return (
                <tr
                  key={coin.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-zinc-500">
                    {coin.marketCapRank ?? '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {coin.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coin.imageUrl}
                          alt={coin.symbol}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      )}
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-50">
                          {coin.name ?? coin.symbol}
                        </div>
                        <div className="text-xs text-zinc-500">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${priceColor} ${flashClass}`}>
                    {formatKrw(coin.currentPrice)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange24h)}`}>
                    {formatPercent(coin.priceChange24h)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange7d)}`}>
                    {formatPercent(coin.priceChange7d)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-zinc-700 dark:text-zinc-300 hidden md:table-cell">
                    {formatLargeKrw(coin.marketCap)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-zinc-700 dark:text-zinc-300 hidden lg:table-cell">
                    {formatLargeKrw(coin.volume24h)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CoinPagination
        totalPages={page.totalPages}
        currentPage={page.number}
        totalElements={page.totalElements}
      />
    </>
  );
}
