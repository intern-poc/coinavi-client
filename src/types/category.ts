/**
 * 백엔드 CategoryResponse 와 1:1.
 *
 * <p>{@code id} 는 CoinGecko slug (예: "layer-1", "decentralized-finance-defi").
 * URL 경로·query param 에 그대로 사용 가능.
 */
export type Category = {
  id: string;
  name: string;
};
