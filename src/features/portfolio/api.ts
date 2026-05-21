import { api } from '@/lib/api';
import type { DisplayCurrency } from '@/lib/format';
import type {
  CollectionJob,
  Portfolio,
  PortfolioSnapshot,
  RefreshJobCreated,
  SnapshotRange,
} from '@/types/portfolio';

/**
 * 포트폴리오 조회 — PriceResolver 시세 적용된 평가금액·비중 포함. 인증 필요.
 */
export function fetchPortfolio(currency: DisplayCurrency = 'KRW'): Promise<Portfolio> {
  return api.get<Portfolio>(`/api/v1/portfolio?currency=${currency}`);
}

/**
 * 거래소 자산 재수집 트리거. 즉시 202 + jobId 반환 — 실제 수집은 MQ 워커가 비동기 처리.
 * 호출 후 jobId 로 {@link fetchCollectionJob} polling 해서 완료 감지.
 */
export function refreshPortfolio(): Promise<RefreshJobCreated> {
  return api.post<RefreshJobCreated>('/api/v1/portfolio/refresh');
}

/**
 * 수집 job 상태 조회. status === 'SUCCEEDED' 또는 'FAILED' 면 종결.
 */
export function fetchCollectionJob(jobId: number): Promise<CollectionJob> {
  return api.get<CollectionJob>(`/api/v1/collection/jobs/${jobId}`);
}

/**
 * 자산 추이 시계열 스냅샷 조회 — 도입 이후 사용자가 방문한 날들의 점.
 * Phase 1 은 KRW 단위만.
 */
export function fetchPortfolioSnapshots(
  range: SnapshotRange = '1m'
): Promise<PortfolioSnapshot[]> {
  return api.get<PortfolioSnapshot[]>(`/api/v1/portfolio/snapshots?range=${range}`);
}
