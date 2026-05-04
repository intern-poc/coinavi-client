/**
 * 백엔드 UserResponse 와 1:1. GET /api/v1/users/me 응답.
 *
 * 내부·운영 필드 (provider, providerUserId, lastLoginAt 등) 는 백엔드가 응답에 포함
 * 안 하므로 여기에도 없음.
 */
export type UserMe = {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
};
