import { BackButton } from '@/components/back-button';
import { Header } from '@/components/header';
import { CurrencyToggle } from '@/components/currency-toggle';
import { PortfolioClient } from '@/features/portfolio/portfolio-client';

/**
 * 포트폴리오 페이지 \`/portfolio\` — 인증 필요.
 *
 * <p>실제 인증 체크와 데이터 fetch 는 client component {@link PortfolioClient} 에서.
 * 페이지는 Header + 컨테이너 shell + 뒤로가기·통화 토글.
 */
export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <BackButton />
          <CurrencyToggle />
        </div>
        <PortfolioClient />
      </main>
    </div>
  );
}
