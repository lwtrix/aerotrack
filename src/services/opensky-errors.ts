export type OpenSkyFailureCode =
  | "rate_limited"
  | "forbidden"
  | "bad_request"
  | "upstream_unavailable"
  | "timeout"
  | "network_error";

const DEFAULT_RETRY_SECONDS: Record<OpenSkyFailureCode, number> = {
  rate_limited: 120,
  forbidden: 300,
  bad_request: 60,
  upstream_unavailable: 120,
  timeout: 120,
  network_error: 120,
};

const MIN_RETRY_SECONDS = 30;
const MAX_RETRY_SECONDS = 300;

export function clampRetryAfterSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_RETRY_SECONDS;
  return Math.min(
    MAX_RETRY_SECONDS,
    Math.max(MIN_RETRY_SECONDS, Math.round(seconds)),
  );
}

export function defaultRetrySecondsForCode(code: OpenSkyFailureCode): number {
  return DEFAULT_RETRY_SECONDS[code];
}

/**
 * Parses Retry-After as delta-seconds only (integer). HTTP-date form is ignored.
 */
export function parseRetryAfterHeaderSeconds(
  headerValue: string | null,
): number | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return clampRetryAfterSeconds(parsed);
}

export class OpenSkyRequestError extends Error {
  readonly code: OpenSkyFailureCode;
  readonly retryAfterSeconds: number;
  readonly httpStatus?: number;

  constructor(
    message: string,
    code: OpenSkyFailureCode,
    options?: { retryAfterSeconds?: number; httpStatus?: number },
  ) {
    super(message);
    this.name = "OpenSkyRequestError";
    this.code = code;
    this.httpStatus = options?.httpStatus;
    const base = options?.retryAfterSeconds ?? defaultRetrySecondsForCode(code);
    this.retryAfterSeconds = clampRetryAfterSeconds(base);
  }
}

export function isOpenSkyRequestError(
  error: unknown,
): error is OpenSkyRequestError {
  return error instanceof OpenSkyRequestError;
}
