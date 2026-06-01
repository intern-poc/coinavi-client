'use client';

import type { ExchangeApiKey } from '@/types/exchange-key';
import { EXCHANGE_LABELS } from '@/types/exchange-key';

/**
 * 등록된 거래소 API 키 리스트. 빈 상태는 안내 + CTA 가 아닌 단순 메시지 (CTA 는 아래 폼이 담당).
 *
 * <p>마스킹된 키 표시 — 백엔드가 평문 절대 안 내려줌. {@code apiKeyMasked} 는
 * 예: "abcd...wxyz" 형식. 마지막 사용 시각은 거래소 호출 시점 (포트폴리오 새로고침 등) 갱신.
 */
export function ExchangeKeyList({
  keys,
  onDelete,
  deletingId,
}: {
  keys: ExchangeApiKey[];
  onDelete: (id: number) => void;
  deletingId: number | null;
}) {
  if (keys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500">
        아직 등록된 거래소가 없어요. 아래 폼에서 첫 키를 등록해보세요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-3 px-4">거래소</th>
            <th className="py-3 px-4">API Key</th>
            <th className="py-3 px-4">마지막 사용</th>
            <th className="py-3 px-4 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr
              key={k.id}
              className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
            >
              <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-50">
                {EXCHANGE_LABELS[k.exchange]}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {k.apiKeyMasked}
              </td>
              <td className="py-3 px-4 text-sm text-zinc-500">
                {formatRelative(k.lastUsedAt)}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(k.id)}
                  disabled={deletingId === k.id}
                  className="text-xs px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
                >
                  {deletingId === k.id ? '삭제 중...' : '삭제'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return '-';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '-';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '방금';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}
