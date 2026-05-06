'use client';

import { useEffect, useRef, useState } from 'react';
import { CoinPagination } from './coin-pagination';
import type { Page } from '@/types/api';
import type { CoinSummary } from '@/types/coin';
import type { UpbitTickerEvent } from '@/types/upbit-ticker';
import { changeColor, formatKrw, formatLargeKrw, formatPercent } from '@/lib/format';

/**
 * 코인 시세 테이블. 백엔드 SSE stream 으로 frame push 받아 row 단위 patch.
 *
 * <p><b>이전 (polling)</b>: setInterval(1000ms) 로 GET /coins 매초 호출 → 평균 0.5~1초 지연.
 * <b>현재 (SSE)</b>: EventSource 로 long-lived connection 유지 → push 받자마자 갱신 (\\u003c50ms).
 *
 * <p><b>frame 매칭</b>: SSE frame 의 code 는 "KRW-BTC" 형식. page.content 의 coin 은 symbol 기반.
 * code.split('-')[1] 로 symbol 추출 후 매칭. 다른 page 의 코인 frame 은 무시 (현 페이지 X).
 *
 * <p><b>EventSource 자동 재연결</b>: 브라우저 기본 동작. 별도 onerror 처리 불필요. 다만
 * 백엔드 일시 장애 시 콘솔 경고만 남김.
 */
const FLASH_DURATION_MS = 300;

type FlashDirection = 'up' | 'down';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export function CoinTable({ initialPage }: { initialPage: Page<CoinSummary> }) {
  const [page, setPage] = useState(initialPage);
  const [flashes, setFlashes] = useState<Map<number, FlashDirection>>(new Map());

  // 이전 가격 — 변경이 re-render 트리거 안 하게 ref.
  const prevPrices = useRef<Map<number, number>>(new Map());
  const flashTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // initialPage 변경 시 (페이지 이동 등) state·ref 동기화.
  useEffect(() => {
    setPage(initialPage);
    prevPrices.current.clear();
    initialPage.content.forEach((c) => {
      if (c.currentPrice != null) prevPrices.current.set(c.id, c.currentPrice);
    });
  }, [initialPage]);

  // SSE stream 연결 — mount 시 1번. EventSource 가 자동 재연결.
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/v1/coins/stream`);

    es.addEventListener('ticker', (event) => {
      const frame: UpbitTickerEvent = JSON.parse((event as MessageEvent).data);
      applyFrame(frame);
    });

    es.onerror = () => {
      // EventSource 가 자동 재연결 — 콘솔에만 알림. UI 차단 X.
      console.warn('[SSE] connection error — auto reconnecting');
    };

    return () => {
      es.close();
      // flash timeout 정리
      flashTimeoutRef.current.forEach((t) => clearTimeout(t));
      flashTimeoutRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFrame(frame: UpbitTickerEvent) {
    // "KRW-BTC" → "BTC"
    const symbol = frame.code.split('-')[1];
    if (!symbol) return;

    const newPrice = frame.trade_price;
    const newChange24h = frame.signed_change_rate * 100;   // 소수 → %
    const newVolume = frame.acc_trade_price_24h;

    setPage((prev) => {
      const idx = prev.content.findIndex((c) => c.symbol === symbol);
      if (idx < 0) return prev;   // 다른 페이지의 코인 — 무시

      const old = prev.content[idx];
      // 가격 동일하면 re-render 회피
      if (old.currentPrice === newPrice && old.priceChange24h === newChange24h) {
        return prev;
      }

      const updated = [...prev.content];
      updated[idx] = {
        ...old,
        currentPrice: newPrice,
        priceChange24h: newChange24h,
        volume24h: newVolume,
      };
      return { ...prev, content: updated };
    });

    const coinId = coinIdBySymbol(symbol);
    if (coinId == null) return;   // 다른 페이지 코인 — flash·prev 갱신 모두 skip

    // flash 처리 — prev 가격 비교 후 방향 결정.
    const oldPrice = prevPrices.current.get(coinId);
    if (oldPrice != null && oldPrice !== newPrice) {
      const direction: FlashDirection = newPrice > oldPrice ? 'up' : 'down';
      setFlashes((prev) => new Map(prev).set(coinId, direction));
      // 기존 timeout 있으면 clear 후 새로 set
      const existing = flashTimeoutRef.current.get(coinId);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setFlashes((prev) => {
          const next = new Map(prev);
          next.delete(coinId);
          return next;
        });
        flashTimeoutRef.current.delete(coinId);
      }, FLASH_DURATION_MS);
      flashTimeoutRef.current.set(coinId, t);
    }
    // prev 갱신
    prevPrices.current.set(coinId, newPrice);
  }

  // page.content 안에서 symbol 로 coinId 찾기. ref 가 아니라 state page 사용 — symbol → id 룩업 즉시.
  function coinIdBySymbol(symbol: string): number | null {
    const found = page.content.find((c) => c.symbol === symbol);
    return found?.id ?? null;
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">암호화폐 시세</h2>
        <span className="text-sm text-zinc-500 hidden sm:inline">
          실시간 (SSE)
        </span>
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
