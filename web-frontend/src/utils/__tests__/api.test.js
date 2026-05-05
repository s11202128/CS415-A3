import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, setToken, clearToken } from "../../api.js";

/**
 * Tests for the shared `api` HTTP wrapper. We mock global.fetch and assert:
 *  - the auth token is forwarded as a Bearer header when set,
 *  - error responses are unwrapped from { error: "..." } envelopes,
 *  - the 12-digit account number guard short-circuits before fetch,
 *  - JSON responses are parsed and non-JSON ones are returned as text.
 */
describe("api client", () => {
    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock;
        clearToken();
    });

    afterEach(() => {
        clearToken();
        vi.restoreAllMocks();
    });

    function jsonResponse(body, { ok = true, status = 200 } = {}) {
        return {
            ok,
            status,
            statusText: ok ? "OK" : "Error",
            headers: { get: () => "application/json" },
            json: async () => body,
            text: async () => JSON.stringify(body),
        };
    }

    it("attaches a Bearer Authorization header when a token is set", async () => {
        setToken("abc.def.ghi");
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await api.getAccounts();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers["Authorization"]).toBe("Bearer abc.def.ghi");
        expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("does NOT send Authorization header when no token is set", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
        await api.getAccounts();
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers["Authorization"]).toBeUndefined();
    });

    it("unwraps the `error` field from a non-OK JSON response", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ error: "Account locked" }, { ok: false, status: 403 })
        );

        await expect(api.login({ email: "a", password: "b" })).rejects.toThrow(
            "Account locked"
        );
    });

    it("falls back to status text when the error body is not JSON", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: { get: () => "text/html" },
            json: async () => {
                throw new Error("not json");
            },
            text: async () => "<html>boom</html>",
        });

        await expect(api.getAccounts()).rejects.toThrow("500 Internal Server Error");
    });

    it("rejects an account-creation request with a non-12-digit account number before calling fetch", async () => {
        await expect(
            api.createAccount({ accountNumber: "123" })
        ).rejects.toThrow("Reenter 12 digit number");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("translates network failures into a friendly error", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
        await expect(api.getAccounts()).rejects.toThrow(
            /Cannot reach backend server/
        );
    });

    it("returns parsed JSON on success", async () => {
        const body = [{ id: 1 }, { id: 2 }];
        fetchMock.mockResolvedValue(jsonResponse(body));
        const result = await api.getAccounts();
        expect(result).toEqual(body);
    });
});
