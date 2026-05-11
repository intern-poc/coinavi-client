import Link from "next/link";
import { Header } from "@/components/header";
import { ExchangeKeysClient } from "@/features/exchange-keys/exchange-keys-client";

/**
 * 거래소 API 키 관리 페이지 `/exchange-keys` — 인증 필요.
 *
 * <p>실제 인증 체크와 키 fetch 는 client component {@link ExchangeKeysClient} 에서 처리
 * (useAuth 훅 활용). 페이지는 단순 Header + 컨테이너 shell.
 */
export default function ExchangeKeysPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          ←
        </Link>
        <ExchangeKeysClient />
      </main>
    </div>
  );
}
