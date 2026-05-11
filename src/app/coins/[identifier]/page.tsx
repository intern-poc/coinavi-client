import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Header } from "@/components/header";
import { fetchCoinDetail, fetchCoinChart } from "@/features/coins/api";
import { CoinDetailHeader } from "@/features/coin-detail/coin-detail-header";
import { CoinDetailStats } from "@/features/coin-detail/coin-detail-stats";
import { CoinDetailChart } from "@/features/coin-detail/coin-detail-chart";
import { CoinDetailDescription } from "@/features/coin-detail/coin-detail-description";
import type { ChartRange } from "@/types/chart";
import { CHART_RANGES } from "@/types/chart";
import type { DisplayCurrency } from "@/lib/format";

type Props = {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ range?: string; currency?: string }>;
};

/**
 * 코인 단건 페이지 — `/coins/{identifier}?range=&currency=`
 *
 * <p>Server Component 가 detail + chart 를 병렬 fetch 후 컴포넌트 조립.
 * range/currency 토글은 URL 변경 → 이 컴포넌트 다시 실행 → 새 데이터로 재렌더.
 *
 * <p>identifier 미존재 시 백엔드가 404 반환 → fetch throw → {@link notFound} 트리거.
 */
export default async function CoinDetailPage({ params, searchParams }: Props) {
  const { identifier } = await params;
  const sp = await searchParams;

  const range: ChartRange = CHART_RANGES.includes(sp.range as ChartRange)
    ? (sp.range as ChartRange)
    : "1d";
  const currency: DisplayCurrency =
    sp.currency?.toUpperCase() === "USD" ? "USD" : "KRW";

  let coin;
  let chart;
  try {
    [coin, chart] = await Promise.all([
      fetchCoinDetail(identifier, currency),
      fetchCoinChart(identifier, range, currency),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={currency === "USD" ? "/?currency=USD" : "/"}
            className="inline-flex items-center text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            ←
          </Link>
          <CurrencyToggle />
        </div>
        <CoinDetailHeader coin={coin} currency={currency} />
        <CoinDetailStats coin={coin} currency={currency} />
        <CoinDetailChart chart={chart} range={range} currency={currency} />
        <CoinDetailDescription coin={coin} />
      </main>
    </div>
  );
}
