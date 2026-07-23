import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../api/types';

// Backend admin CRUD endpoints uniformly return { error: string } for 404/409/
// business-rule 400 (see backend/VeronzoApi/Models/Admin/ApiErrorResponse.cs).
// This extracts that message for display, falling back to a generic string for
// network failures / unexpected shapes.
export function getApiErrorMessage(error: unknown, fallback = 'Не удалось выполнить операцию'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error) {
      return data.error;
    }
  }
  return fallback;
}
