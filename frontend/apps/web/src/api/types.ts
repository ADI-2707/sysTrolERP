export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message || "An API error occurred");
    this.name = "ApiClientError";
    this.status = status;
    this.code = envelope.code || "unknown_error";
    this.fields = envelope.fields || {};
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
}
