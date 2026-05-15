'use client';

import { useState } from 'react';
import type { ExchangeCode } from '@/types/exchange-key';
import { EXCHANGE_LABELS } from '@/types/exchange-key';

/**
 * 거래소 API 키 등록 폼.
 *
 * <p><b>입력 정책</b>:
 * <ul>
 *   <li>secret 은 password input — 어깨너머·녹화 노출 방지. 눈 아이콘으로 토글 가능</li>
 *   <li>{@code trim()} — 사용자가 거래소 페이지에서 복붙할 때 공백 묻어옴</li>
 *   <li>제출 중엔 모든 input + 버튼 disable — double-submit 방지</li>
 * </ul>
 *
 * <p>등록 성공 시 폼 초기화 + 부모에 통보 (리스트 refetch). 실패 시 에러 메시지 노출.
 */
export function ExchangeKeyForm({
  onRegister,
  registering,
  alreadyRegistered,
}: {
  onRegister: (exchange: ExchangeCode, apiKey: string, secret: string) => Promise<void>;
  registering: boolean;
  alreadyRegistered: Set<ExchangeCode>;
}) {
  const [exchange, setExchange] = useState<ExchangeCode>('UPBIT');
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = alreadyRegistered.has(exchange);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (duplicate) {
      setError(`이미 ${EXCHANGE_LABELS[exchange]} 키가 등록돼 있어요. 삭제 후 다시 등록해주세요.`);
      return;
    }
    try {
      await onRegister(exchange, apiKey.trim(), secret.trim());
      setApiKey('');
      setSecret('');
      setShowSecret(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '등록 실패');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">새 키 등록</h2>

      <div>
        <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-1">
          거래소
        </label>
        <select
          value={exchange}
          onChange={(e) => setExchange(e.target.value as ExchangeCode)}
          disabled={registering}
          className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
        >
          <option value="UPBIT">업비트</option>
          <option value="BITHUMB">빗썸</option>
          <option value="BINANCE">바이낸스</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-1">
          API Key
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          disabled={registering}
          autoComplete="off"
          spellCheck={false}
          className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-mono text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-1">
          API Secret
        </label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
            disabled={registering}
            autoComplete="off"
            spellCheck={false}
            className="w-full px-3 py-2 pr-12 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-mono text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {showSecret ? '숨김' : '보기'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          ⚠ <b>조회 권한만</b> 부여한 키를 등록하세요. 출금·거래 권한은 불필요합니다.
        </p>
        <button
          type="submit"
          disabled={registering || !apiKey || !secret}
          className="px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {registering ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}
