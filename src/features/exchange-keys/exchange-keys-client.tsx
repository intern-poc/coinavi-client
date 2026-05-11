'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExchangeKeyForm } from './exchange-key-form';
import { ExchangeKeyGuide } from './exchange-key-guide';
import { ExchangeKeyList } from './exchange-key-list';
import {
  deleteExchangeKey,
  listMyExchangeKeys,
  registerExchangeKey,
} from './api';
import { useAuth } from '@/features/auth/use-auth';
import type { ExchangeApiKey, ExchangeCode } from '@/types/exchange-key';

/**
 * 거래소 API 키 관리 페이지의 client-side 로직.
 *
 * <p>auth 상태에 따라 분기:
 * <ul>
 *   <li>loading — 깜빡임 방지 스피너</li>
 *   <li>unauthenticated — 로그인 CTA</li>
 *   <li>authenticated — fetch + render</li>
 * </ul>
 *
 * <p>register/delete 후엔 단순히 리스트 refetch (1차 MVP). optimistic update 는 후속.
 */
export function ExchangeKeysClient() {
  const { status } = useAuth();
  const [keys, setKeys] = useState<ExchangeApiKey[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    setLoadError(null);
    try {
      const list = await listMyExchangeKeys();
      setKeys(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '키 조회 실패');
      setKeys([]);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      refresh();
    }
  }, [status]);

  async function handleRegister(exchange: ExchangeCode, apiKey: string, secret: string) {
    setRegistering(true);
    try {
      await registerExchangeKey({ exchange, apiKey, secret });
      await refresh();
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('이 키를 삭제할까요? 등록된 자산 동기화가 중단됩니다.')) return;
    setDeletingId(id);
    try {
      await deleteExchangeKey(id);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  }

  if (status === 'loading') {
    return <div className="text-sm text-zinc-500">불러오는 중...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-700 dark:text-zinc-300 mb-4">
          API 키 관리는 로그인 후 이용할 수 있어요.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 text-sm font-medium hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  const alreadyRegistered = new Set<ExchangeCode>(keys?.map((k) => k.exchange) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          거래소 API 키 관리
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          등록한 키는 AES-256-GCM 으로 암호화되어 저장되며, 평문은 어디에도 노출되지 않습니다.
        </p>
      </div>

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
          {loadError}
        </div>
      )}

      {keys === null ? (
        <div className="text-sm text-zinc-500">키 목록 불러오는 중...</div>
      ) : (
        <ExchangeKeyList keys={keys} onDelete={handleDelete} deletingId={deletingId} />
      )}

      <ExchangeKeyGuide />

      <ExchangeKeyForm
        onRegister={handleRegister}
        registering={registering}
        alreadyRegistered={alreadyRegistered}
      />
    </div>
  );
}
