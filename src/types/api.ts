/**
 * 백엔드 모든 응답이 공통으로 두르는 wrapper.
 *
 * - 성공: { success: true, data: <T> } (error 는 omit)
 * - 실패: { success: false, data: null, error: { code, message, errors? } }
 */
export type CommonResponse<T> = {
  success: boolean;
  data: T | null;
  error?: ErrorBody;
};

export type ErrorBody = {
  code: string;       // 예: "CN-COIN-404-001"
  message: string;
  errors?: ValidationError[];
};

export type ValidationError = {
  field: string;
  rejectedValue?: unknown;
  message: string;
};

/**
 * Spring Data Page<T> 직렬화 형태. 0-based page 인덱스.
 */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;     // 0-based 현재 페이지
  first: boolean;
  last: boolean;
  empty: boolean;
};
