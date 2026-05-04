import { Header } from '@/components/header';
import { CoinTable } from '@/features/coins/coin-table';
import { fetchCoins } from '@/features/coins/api';

/**
 * 메인 페이지 — 코인 시총 순 리스트.
 *
 * 첫 페인트는 Server Component 의 await fetch 로 SSR (빠른 첫 화면 + SEO).
 * 이후 갱신은 Client Component(CoinTable) 가 5초마다 polling.
 */
export default async function Home() {
  const initialPage = await fetchCoins(0, 50);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <CoinTable initialPage={initialPage} />
      </main>
    </div>
  );
}
