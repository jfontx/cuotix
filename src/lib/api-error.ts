import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: { field: string }[] };
}

export function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string {
  if (error && 'status' in error) {
    if (error.status === 'FETCH_ERROR') return 'No hay conexión con el servidor. Revisa tu internet.';
    const message = (error.data as ApiErrorBody | undefined)?.error?.message;
    if (message) return message;
  }
  return 'Algo salió mal, intenta de nuevo.';
}
