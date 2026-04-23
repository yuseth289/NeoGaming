import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api.models';

const DEFAULT_API_ERROR: ApiError = {
  timestamp: '',
  status: 0,
  error: 'Error',
  message: 'Ocurrio un error inesperado.',
  details: []
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseApiError(error: unknown): ApiError {
  const response = error instanceof HttpErrorResponse ? error : null;
  const payload = response?.error;

  if (isRecord(payload)) {
    return {
      timestamp: typeof payload['timestamp'] === 'string' ? payload['timestamp'] : '',
      status: typeof payload['status'] === 'number' ? payload['status'] : response?.status ?? 0,
      error: typeof payload['error'] === 'string' ? payload['error'] : response?.statusText || DEFAULT_API_ERROR.error,
      message: typeof payload['message'] === 'string' ? payload['message'] : response?.message || DEFAULT_API_ERROR.message,
      details: Array.isArray(payload['details']) ? payload['details'].filter((item): item is string => typeof item === 'string') : []
    };
  }

  if (typeof payload === 'string' && payload.trim()) {
    return {
      timestamp: '',
      status: response?.status ?? 0,
      error: response?.statusText || DEFAULT_API_ERROR.error,
      message: payload,
      details: []
    };
  }

  return {
    timestamp: '',
    status: response?.status ?? 0,
    error: response?.statusText || DEFAULT_API_ERROR.error,
    message: response?.message || DEFAULT_API_ERROR.message,
    details: []
  };
}
