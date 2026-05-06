import { Header } from '@/components/header';
import { CoinTable } from '@/features/coins/coin-table';
import { fetchCoins } from '@/features/coins/api';
import type { DisplayCurrency } from '@/lib/format';

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string; currency?: string }>;
};

/**
 * 메인 페이지 — 코인 시총 순 리스트 + 페이지네이션 + 통화 토글.
 *
 * <p>Server Component 가 URL ?page=N&currency=KRW|USD 를 읽어 백엔드에서
 * 해당 페이지·통화로 fetch. Client Component(CoinTable) 가 그 initialPage 와
 * currency 를 받아 SSE 로 갱신 — 각 frame 의 currency 가 모드와 매칭하는
 * 것만 적용 (KRW 모드 → Upbit, USD 모드 → Binance).
 *
 * <p>URL 변경 (페이지네이션 / 통화 토글) → Next.js 가 이 Server Component 다시 렌더 →
 * 새 initialPage 로 CoinTable re-mount.
 */
export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0);
  const currency: DisplayCurrency =
    params.currency?.toUpperCase() === 'USD' ? 'USD' : 'KRW';
  const initialPage = await fetchCoins(page, PAGE_SIZE, currency);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <CoinTable initialPage={initialPage} currency={currency} />
      </main>
    </div>
  );
}
