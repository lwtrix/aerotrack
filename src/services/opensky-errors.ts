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

/** OpenSky-specific bounds for `retryAfterSeconds` exposed to clients. */
export const OPEN_SKY_RETRY_MIN_SECONDS = 30;
export const OPEN_SKY_RETRY_MAX_SECONDS = 86_400;

export function clampOpenSkyRetryAfterSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return OPEN_SKY_RETRY_MIN_SECONDS;
  }
  return Math.min(
    OPEN_SKY_RETRY_MAX_SECONDS,
    Math.max(OPEN_SKY_RETRY_MIN_SECONDS, Math.round(seconds)),
  );
}

export function defaultRetrySecondsForCode(code: OpenSkyFailureCode): number {
  return DEFAULT_RETRY_SECONDS[code];
}

function parsePositiveIntSeconds(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Reads OpenSky / CDN retry hints. `X-Rate-Limit-Retry-After-Seconds` wins over `Retry-After`
 * (delta-seconds integer form only; HTTP-date is ignored).
 */
export function parseOpenSkyRetryAfterSecondsFromResponse(
  response: Response,
): number | null {
  const fromOpenSky = parsePositiveIntSeconds(
    response.headers.get("X-Rate-Limit-Retry-After-Seconds"),
  );
  if (fromOpenSky !== null) {
    return fromOpenSky;
  }
  return parsePositiveIntSeconds(response.headers.get("Retry-After"));
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
    this.retryAfterSeconds = clampOpenSkyRetryAfterSeconds(base);
  }
}

export function isOpenSkyRequestError(
  error: unknown,
): error is OpenSkyRequestError {
  return error instanceof OpenSkyRequestError;
}
