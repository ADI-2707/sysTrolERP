import { ApiClientError, type ApiErrorEnvelope, type RequestOptions } from "./types";

type UnauthorizedListener = () => void;

class ApiClient {
  private unauthorizedListeners: Set<UnauthorizedListener> = new Set();
  private csrfToken: string | null = null;

  public onUnauthorized(listener: UnauthorizedListener): () => void {
    this.unauthorizedListeners.add(listener);
    return () => {
      this.unauthorizedListeners.delete(listener);
    };
  }

  private notifyUnauthorized(): void {
    for (const listener of this.unauthorizedListeners) {
      try {
        listener();
      } catch {}
    }
  }

  public clearCsrfToken(): void {
    this.csrfToken = null;
  }

  public getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  public async getCsrfToken(): Promise<string | null> {
    const fromCookie = this.getCookie("csrftoken");
    if (fromCookie) {
      this.csrfToken = fromCookie;
      return fromCookie;
    }

    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const res = await fetch("/api/auth/csrf/", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = (await res.json()) as { csrfToken?: string };
        if (data.csrfToken) {
          this.csrfToken = data.csrfToken;
          return data.csrfToken;
        }
      }
    } catch {}

    return this.getCookie("csrftoken");
  }

  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    if (!params) return path;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    }
    const queryString = query.toString();
    if (!queryString) return path;
    return path.includes("?") ? `${path}&${queryString}` : `${path}?${queryString}`;
  }

  public async request<T>(
    path: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };

    const isMutative = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
    if (isMutative) {
      const token = await this.getCsrfToken();
      if (token) {
        headers["X-CSRFToken"] = token;
      }
    }

    let requestBody: BodyInit | undefined;
    if (body !== undefined) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        requestBody = body;
      } else {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      credentials: "same-origin",
      signal: options.signal,
    });

    if (response.status === 401) {
      this.notifyUnauthorized();
    }

    if (!response.ok) {
      let envelope: ApiErrorEnvelope;
      try {
        envelope = (await response.json()) as ApiErrorEnvelope;
      } catch {
        envelope = {
          code: `http_${response.status}`,
          message: response.statusText || "Request failed",
        };
      }
      throw new ApiClientError(response.status, envelope);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, "GET", undefined, options);
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, "POST", body, options);
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, "PUT", body, options);
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, "PATCH", body, options);
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, "DELETE", undefined, options);
  }
}

export const apiClient = new ApiClient();
