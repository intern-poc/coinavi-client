import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Coinavi — 암호화폐 자산 통합 관리',
  description: '거래소에 흩어진 암호화폐 자산을 한 곳에서. 실시간 시세 + 통합 포트폴리오.',
};

/**
 * 페이지 첫 페인트 전에 실행될 inline script — FOUC (light→dark 깜빡임) 방지.
 *
 * <p><b>왜 raw {@code dangerouslySetInnerHTML} 인가</b>: React 19 가
 * {@code <Script>} 컴포넌트 함수 return 안의 script 태그도 거부함. layout 의 head 안에
 * suppressHydrationWarning 옵션과 함께 직접 넣어야 hydration 우회됨.
 */
const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var p=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&p))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
