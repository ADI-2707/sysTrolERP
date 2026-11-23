import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "./client";
import { ApiClientError } from "./types";

describe("ApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    apiClient.clearCsrfToken();
  });

  it("performs GET request and parses JSON response", async () => {
    const mockData = { id: 1, name: "Test" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await apiClient.get<typeof mockData>("/api/test/");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith("/api/test/", expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Accept: "application/json" }),
      credentials: "same-origin",
    }));
  });

  it("appends query parameters on GET request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await apiClient.get("/api/test/", { params: { active: true, page: 2 } });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test/?active=true&page=2",
      expect.anything()
    );
  });

  it("attaches CSRF token and JSON body on POST request", async () => {
    document.cookie = "csrftoken=test-csrf-token; path=/";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true }),
    });

    const payload = { username: "admin", password: "password123" };
    const result = await apiClient.post("/api/auth/login/", payload);

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRFToken": "test-csrf-token",
        }),
        body: JSON.stringify(payload),
      })
    );
  });

  it("fetches CSRF token if cookie is absent during mutative request", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: "fetched-csrf-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ created: true }),
      });

    const result = await apiClient.post("/api/projects/", { name: "Project X" });
    expect(result).toEqual({ created: true });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/auth/csrf/",
      expect.anything()
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/projects/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CSRFToken": "fetched-csrf-token",
        }),
      })
    );
  });

  it("throws ApiClientError with error envelope on 400 response", async () => {
    const errorBody = {
      code: "validation_error",
      message: "Validation failed.",
      fields: { title: ["This field is required."] },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => errorBody,
    });

    await expect(apiClient.post("/api/projects/", {})).rejects.toThrow(ApiClientError);
    try {
      await apiClient.post("/api/projects/", {});
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe("validation_error");
      expect(apiErr.message).toBe("Validation failed.");
      expect(apiErr.fields).toEqual({ title: ["This field is required."] });
    }
  });

  it("notifies 401 listeners on unauthorized response", async () => {
    const onUnauthorized = vi.fn();
    const unsubscribe = apiClient.onUnauthorized(onUnauthorized);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: "authentication_failed", message: "Unauthorized." }),
    });

    await expect(apiClient.get("/api/auth/me/")).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    unsubscribe();
    await expect(apiClient.get("/api/auth/me/")).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("handles 204 No Content without parsing JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await apiClient.delete("/api/projects/1/");
    expect(result).toBeUndefined();
  });
});
