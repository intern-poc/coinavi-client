"use client";

import { useEffect, useRef, useState } from "react";
import { CoinPagination } from "./coin-pagination";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Tooltip } from "@/components/tooltip";
import type { Page } from "@/types/api";
import type { CoinSummary } from "@/types/coin";
import type { LivePriceFrame } from "@/types/live-price-frame";
import {
  changeColor,
  formatLargePrice,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from "@/lib/format";

/**
 * 코인 시세 테이블. 백엔드 SSE stream 으로 frame push 받아 row 단위 patch.
 *
 * <p><b>SSE 환산 (currency 모드별)</b>: 모든 frame 받아서 모드에 맞게 환산해서 적용.
 * <ul>
 *   <li>KRW 모드 — Upbit frame 그대로 / Binance frame 은 tradePrice * fxRate 환산</li>
 *   <li>USD 모드 — Binance frame 그대로 / Upbit frame 은 tradePrice / fxRate 환산</li>
 * </ul>
 *
 * <p><b>김치 프리미엄</b>: 같은 코인의 Upbit + Binance frame 둘 다 최근 N초 내 수신 시
 * 계산. 한쪽만 매핑되거나 한쪽이 stale 이면 null. fxRate 는 frame 동봉값 사용.
 *
 * <p>같은 코인에 Upbit·Binance 둘 다 frame 들어올 때 currentPrice 는 timestamp 우선
 * (마지막 frame 적용) — 김프 차이 (보통 1~5%) 로 살짝 진동 가능. 김프 column 이 그
 * 차이를 별도로 명시하므로 진동은 정보 가치로 전환.
 *
 * <p><b>EventSource 자동 재연결</b>: 브라우저 기본 동작.
 */
const FLASH_DURATION_MS = 300;

// 김프 계산 — 양쪽 frame 이 이 시간 내 수신된 경우만 valid.
// Binance miniTicker 가 활발한 코인 매초 / 비활발 코인 몇 초 간격이라 5초 마진.
const KIMCHI_STALE_MS = 5_000;

// 1초 주기로 김프 일괄 재계산 — 매 frame 마다 setState 하면 1초당 700+ 갱신이라 부담.
const KIMCHI_RECALC_INTERVAL_MS = 1_000;

// 표시 노이즈 방지 — 0.01% 미만 (반올림 0%) 은 "≈0%" 로.
const KIMCHI_MIN_DISPLAY = 0.01;

type FlashDirection = "up" | "down";

type FrameSnapshot = {
  price: number;
  fxRate: number;
  receivedAt: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function CoinTable({
  initialPage,
  currency,
}: {
  initialPage: Page<CoinSummary>;
  currency: DisplayCurrency;
}) {
  const [page, setPage] = useState(initialPage);
  const [flashes, setFlashes] = useState<Map<number, FlashDirection>>(
    new Map(),
  );
  const [kimchiByCoin, setKimchiByCoin] = useState<Map<number, number>>(
    new Map(),
  );

  const prevPrices = useRef<Map<number, number>>(new Map());
  const flashTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // 김프 계산용 — 거래소별 마지막 frame 캐시. 매 SSE message 마다 갱신, re-render X.
  const lastUpbitByCoin = useRef<Map<number, FrameSnapshot>>(new Map());
  const lastBinanceByCoin = useRef<Map<number, FrameSnapshot>>(new Map());

  // 1초 interval 콜백이 최신 page.content 를 ref 로 접근 — useEffect deps 에 page.content
  // 를 두면 매 setPage 마다 (1초당 수십 번) cleanup·restart 되어 interval 이 영원히 도래
  // 못 함. 활발한 코인일수록 setPage 빈도 높아 김프가 더 안 뜨는 역설 발생.
  const contentRef = useRef(page.content);
  contentRef.current = page.content;

  useEffect(() => {
    setPage(initialPage);
    prevPrices.current.clear();
    initialPage.content.forEach((c) => {
      if (c.currentPrice != null) prevPrices.current.set(c.id, c.currentPrice);
    });
  }, [initialPage]);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/v1/coins/stream`);

    es.addEventListener("ticker", (event) => {
      const frame: LivePriceFrame = JSON.parse((event as MessageEvent).data);
      applyFrame(frame);
    });

    es.onerror = () => {
      console.warn("[SSE] connection error — auto reconnecting");
    };

    return () => {
      es.close();
      flashTimeoutRef.current.forEach((t) => clearTimeout(t));
      flashTimeoutRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  // 1초 주기 김프 일괄 재계산. mount 시 1번만 set. page.content 는 ref 로 접근.
  useEffect(() => {
    const interval = setInterval(() => {
      const next = new Map<number, number>();
      for (const coin of contentRef.current) {
        const k = computeKimchi(
          lastUpbitByCoin.current.get(coin.id),
          lastBinanceByCoin.current.get(coin.id),
        );
        if (k !== null) next.set(coin.id, k);
      }
      setKimchiByCoin(next);
    }, KIMCHI_RECALC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function applyFrame(frame: LivePriceFrame) {
    // 거래소별 ref 갱신 — 김프 계산용.
    const snapshot: FrameSnapshot = {
      price: frame.tradePrice,
      fxRate: frame.fxRate,
      receivedAt: Date.now(),
    };
    if (frame.exchange === "UPBIT") {
      lastUpbitByCoin.current.set(frame.coinId, snapshot);
    } else if (frame.exchange === "BINANCE") {
      lastBinanceByCoin.current.set(frame.coinId, snapshot);
    }

    const converted = convertFrame(frame, currency);
    if (converted == null) return;

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
      const direction: FlashDirection = price > oldPrice ? "up" : "down";
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
        {/*
         * table-fixed + colgroup: SSE 로 1초마다 셀 값 길이가 바뀌면 (예: "+0.02%" ↔ "-12.34%")
         * auto layout 은 매번 컬럼 너비를 재계산해 표 전체가 jitter. 여기서 너비 고정.
         * 코인 컬럼만 너비 미지정 → 남는 공간 차지.
         */}
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="hidden md:table-column w-32" />
            <col className="hidden lg:table-column w-36" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">코인</th>
              <th className="py-3 px-4 text-right">현재가</th>
              <th className="py-3 px-4 text-right">24h</th>
              <th className="py-3 px-4 text-right">
                <Tooltip
                  placement="bottom"
                  content={
                    <>
                      <div className="font-semibold mb-1">김치 프리미엄</div>
                      <div>업비트와 바이낸스(USDT × 환율) 의 가격 차이</div>
                      <div className="mt-1 text-zinc-400">
                        양 거래소 모두 실시간 수신 중인 코인만 표시
                      </div>
                    </>
                  }
                >
                  김프
                </Tooltip>
              </th>
              <th className="py-3 px-4 text-right">7d</th>
              <th className="py-3 px-4 text-right hidden md:table-cell">
                시가총액
              </th>
              <th className="py-3 px-4 text-right hidden lg:table-cell">
                거래량 (24h)
              </th>
            </tr>
          </thead>
          <tbody>
            {page.content.map((coin) => {
              const flash = flashes.get(coin.id);
              const flashClass =
                flash === "up"
                  ? "price-flash-up"
                  : flash === "down"
                    ? "price-flash-down"
                    : "";
              const priceColor = changeColor(coin.priceChange24h);
              const kimchi = kimchiByCoin.get(coin.id) ?? null;
              return (
                <tr
                  key={coin.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-zinc-500">
                    {coin.marketCapRank ?? "-"}
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
                        <div className="text-xs text-zinc-500">
                          {coin.symbol}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${priceColor} ${flashClass}`}
                  >
                    {formatPrice(coin.currentPrice, currency)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange24h)}`}
                  >
                    {formatPercent(coin.priceChange24h)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono text-sm ${kimchiColor(kimchi)}`}
                  >
                    {kimchi == null ? (
                      <Tooltip content="업비트 또는 바이낸스 한쪽에만 상장돼 있어 김프 계산이 불가합니다">
                        <span>-</span>
                      </Tooltip>
                    ) : (
                      formatKimchi(kimchi)
                    )}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono ${changeColor(coin.priceChange7d)}`}
                  >
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
function convertFrame(
  frame: LivePriceFrame,
  target: DisplayCurrency,
): ConvertedPrice | null {
  const { coinId, currency, tradePrice, changeRate, volume24h, fxRate } = frame;

  if (currency === "KRW" && target === "KRW") {
    return { coinId, price: tradePrice, changeRate, volume: volume24h };
  }
  if (currency === "USDT" && target === "USD") {
    return { coinId, price: tradePrice, changeRate, volume: volume24h };
  }
  if (!fxRate || fxRate <= 0) return null;

  if (currency === "USDT" && target === "KRW") {
    return {
      coinId,
      price: tradePrice * fxRate,
      changeRate,
      volume: volume24h * fxRate,
    };
  }
  if (currency === "KRW" && target === "USD") {
    return {
      coinId,
      price: tradePrice / fxRate,
      changeRate,
      volume: volume24h / fxRate,
    };
  }
  return null;
}

/**
 * 김프 계산. 두 frame 모두 stale 아니고 fxRate 있어야 valid.
 * 한쪽이라도 누락·stale 이면 null → "-" 표시.
 */
function computeKimchi(
  upbit: FrameSnapshot | undefined,
  binance: FrameSnapshot | undefined,
): number | null {
  if (!upbit || !binance) return null;

  const now = Date.now();
  if (now - upbit.receivedAt > KIMCHI_STALE_MS) return null;
  if (now - binance.receivedAt > KIMCHI_STALE_MS) return null;

  // 두 frame 의 fxRate 는 거의 같음 (서버 단일 환율 source) — Binance 쪽 우선.
  const fxRate = binance.fxRate || upbit.fxRate;
  if (!fxRate || fxRate <= 0) return null;

  const binanceKrw = binance.price * fxRate;
  if (binanceKrw <= 0) return null;

  return ((upbit.price - binanceKrw) / binanceKrw) * 100;
}

function formatKimchi(value: number | null): string {
  if (value == null) return "-";
  if (Math.abs(value) < KIMCHI_MIN_DISPLAY) return "≈0%";
  return formatPercent(value);
}

/**
 * 김프 색상 — 한국 거래소 컨벤션 (양수 빨강·음수 파랑) 와 일치.
 * 양수 김프 = 한국이 더 비쌈 (정상 김프). 음수 = 역김프.
 */
function kimchiColor(value: number | null): string {
  if (value == null) return "text-zinc-400";
  if (Math.abs(value) < KIMCHI_MIN_DISPLAY) return "text-zinc-500";
  return changeColor(value);
}
