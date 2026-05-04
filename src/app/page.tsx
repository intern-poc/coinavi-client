import { Header } from '@/components/header';
import { CoinTable } from '@/features/coins/coin-table';
import { fetchCoins } from '@/features/coins/api';

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * 메인 페이지 — 코인 시총 순 리스트 + 페이지네이션.
 *
 * <p>Server Component 가 URL ?page=N 을 읽어 백엔드에서 해당 페이지를 fetch.
 * Client Component(CoinTable) 가 그 initialPage 를 받아 1초 polling.
 *
 * <p>page 변경은 CoinPagination 이 router.push('?page=N') 으로 트리거 → Next.js 가
 * 이 Server Component 다시 렌더 → 새 initialPage 로 CoinTable re-mount.
 */
export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0);
  const initialPage = await fetchCoins(page, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <CoinTable initialPage={initialPage} />
      </main>
    </div>
  );
}
