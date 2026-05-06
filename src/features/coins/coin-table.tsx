'use client';

import { useEffect, useRef, useState } from 'react';
import { CoinPagination } from './coin-pagination';
import { CurrencyToggle } from '@/components/currency-toggle';
import type { Page } from '@/types/api';
import type { CoinSummary } from '@/types/coin';
import type { LivePriceFrame } from '@/types/live-price-frame';
import {
  changeColor,
  formatLargePrice,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from '@/lib/format';

/**
 * 코인 시세 테이블. 백엔드 SSE stream 으로 frame push 받아 row 단위 patch.
 *
 * <p><b>SSE 환산 (currency 모드별)</b>: 모든 frame 받아서 모드에 맞게 환산해서 적용.
 * <ul>
 *   <li>KRW 모드 — Upbit frame 그대로 / Binance frame 은 tradePrice * fxRate 환산</li>
 *   <li>USD 모드 — Binance frame 그대로 / Upbit frame 은 tradePrice / fxRate 환산</li>
 * </ul>
 *
 * <p>이러면 Upbit 매핑 안 된 코인 (페이지 5+ 다수) 도 Binance frame 으로 실시간 갱신.
 * 같은 코인에 Upbit·Binance 둘 다 frame 들어오면 timestamp 우선 — 마지막 frame 적용.
 * 김프 차이 (보통 1~5%) 로 살짝 진동 가능, 정밀 우선순위는 9단계 김프 표시 PR 에서.
 *
 * <p><b>EventSource 자동 재연결</b>: 브라우저 기본 동작.
 */
const FLASH_DURATION_MS = 300;

type FlashDirection = 'up' | 'down';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export function CoinTable({
  initialPage,
  currency,
}: {
  initialPage: Page<CoinSummary>;
  currency: DisplayCurrency;
}) {
  const [page, setPage] = useState(initialPage);
  const [flashes, setFlashes] = useState<Map<number, FlashDirection>>(new Map());

  const prevPrices = useRef<Map<number, number>>(new Map());
  const flashTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setPage(initialPage);
    prevPrices.current.clear();
    initialPage.content.forEach((c) => {
      if (c.currentPrice != null) prevPrices.current.set(c.id, c.currentPrice);
    });
  }, [initialPage]);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/v1/coins/stream`);

    es.addEventListener('ticker', (event) => {
      const frame: LivePriceFrame = JSON.parse((event as MessageEvent).data);
      applyFrame(frame);
    });

    es.onerror = () => {
      console.warn('[SSE] connection error — auto reconnecting');
    };

    return () => {
      es.close();
      flashTimeoutRef.current.forEach((t) => clearTimeout(t));
      flashTimeoutRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  function applyFrame(frame: LivePriceFrame) {
    const converted = convertFrame(frame, currency);
    if (converted == null) return;   // fxRate 누락 등 환산 불가

    const { coinId, price, changeRate, volume } = converted;

    setPage((prev) => {
      const idx = prev.content.findIndex((c) => c.id === coinId);
      if (idx < 0) return prev;

      const old = prev.content[idx];
      if (old.currentPrice === price && old.priceChange24h === changeRate) {
        return prev;
      }

      const updated = [...prev.content];
      updated[idx] = {
        ...old,
        currentPrice: price,
        priceChange24h: changeRate,
        volume24h: volume,
      };
      return { ...prev, content: updated };
    });

    if (!page.content.some((c) => c.id === coinId)) return;

    const oldPrice = prevPrices.current.get(coinId);
    if (oldPrice != null && oldPrice !== price) {
      const direction: FlashDirection = price > oldPrice ? 'up' : 'down';
      setFlashes((prev) => new Map(prev).set(coinId, direction));
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
    prevPrices.current.set(coinId, price);
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          암호화폐 시세
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden sm:inline">
            실시간 (SSE)
          </span>
          <CurrencyToggle />
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
                    {formatPrice(coin.currentPrice, currency)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange24h)}`}>
                    {formatPercent(coin.priceChange24h)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange7d)}`}>
                    {formatPercent(coin.priceChange7d)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-zinc-700 dark:text-zinc-300 hidden md:table-cell">
                    {formatLargePrice(coin.marketCap, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-zinc-700 dark:text-zinc-300 hidden lg:table-cell">
                    {formatLargePrice(coin.volume24h, currency)}
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

type ConvertedPrice = {
  coinId: number;
  price: number;
  changeRate: number;
  volume: number;
};

/**
 * frame 의 거래소 원본 통화 → 표시 통화 환산.
 * 환산 불가능 (fxRate 0 또는 null) 시 null 반환 → applyFrame 이 skip.
 */
function convertFrame(frame: LivePriceFrame, target: DisplayCurrency): ConvertedPrice | null {
  const { coinId, currency, tradePrice, changeRate, volume24h, fxRate } = frame;

  // 같은 통화면 환산 불필요.
  if (currency === 'KRW' && target === 'KRW') {
    return { coinId, price: tradePrice, changeRate, volume: volume24h };
  }
  if (currency === 'USDT' && target === 'USD') {
    return { coinId, price: tradePrice, changeRate, volume: volume24h };
  }

  if (!fxRate || fxRate <= 0) return null;

  // KRW 모드 + Binance frame (USDT) → KRW 환산.
  if (currency === 'USDT' && target === 'KRW') {
    return {
      coinId,
      price: tradePrice * fxRate,
      changeRate,
      volume: volume24h * fxRate,
    };
  }
  // USD 모드 + Upbit frame (KRW) → USD 환산.
  if (currency === 'KRW' && target === 'USD') {
    return {
      coinId,
      price: tradePrice / fxRate,
      changeRate,
      volume: volume24h / fxRate,
    };
  }
  return null;
}
