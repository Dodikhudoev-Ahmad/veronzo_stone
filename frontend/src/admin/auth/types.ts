export interface AdminUserResponse {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  admin: AdminUserResponse;
}
