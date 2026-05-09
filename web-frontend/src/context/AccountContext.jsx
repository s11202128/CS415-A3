import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const STORAGE_KEY = "bof.activeAccountId";

const AccountContext = createContext(null);

function readStoredActiveId() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) || null : null;
  } catch {
    return null;
  }
}

function writeStoredActiveId(id) {
  try {
    if (id == null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    /* ignore */
  }
}

function pickInitialActive(accounts) {
  if (!accounts || accounts.length === 0) return null;
  const stored = readStoredActiveId();
  if (stored && accounts.some((a) => a.id === stored)) return stored;
  const def = accounts.find((a) => a.isDefault);
  if (def) return def.id;
  return accounts[0].id;
}

export function AccountProvider({ children, enabled = true }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountIdState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMyAccounts();
      const items = Array.isArray(data?.items) ? data.items : [];
      setAccounts(items);
      setActiveAccountIdState((prev) => {
        if (prev && items.some((a) => a.id === prev)) return prev;
        return pickInitialActive(items);
      });
    } catch (err) {
      setError(err?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refresh();
    else {
      setAccounts([]);
      setActiveAccountIdState(null);
    }
  }, [enabled, refresh]);

  const setActiveAccountId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    setActiveAccountIdState(next);
    writeStoredActiveId(next);
  }, []);

  const renameAccount = useCallback(async (id, nickname) => {
    const updated = await api.renameAccount(id, nickname);
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    return updated;
  }, []);

  const setDefaultAccount = useCallback(async (id) => {
    const updated = await api.setDefaultAccount(id);
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updated, isDefault: true } : { ...a, isDefault: false },
      ),
    );
    return updated;
  }, []);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || null,
    [accounts, activeAccountId],
  );

  const value = useMemo(
    () => ({
      accounts,
      activeAccount,
      activeAccountId,
      setActiveAccountId,
      refresh,
      renameAccount,
      setDefaultAccount,
      loading,
      error,
    }),
    [accounts, activeAccount, activeAccountId, setActiveAccountId, refresh, renameAccount, setDefaultAccount, loading, error],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    return {
      accounts: [],
      activeAccount: null,
      activeAccountId: null,
      setActiveAccountId: () => {},
      refresh: async () => {},
      renameAccount: async () => {},
      setDefaultAccount: async () => {},
      loading: false,
      error: null,
    };
  }
  return ctx;
}

export default AccountContext;
