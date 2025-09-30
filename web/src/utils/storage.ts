const TOKEN_KEY = 'shelter:token';
const SHADOW_ID_KEY = 'shelter:shadowId';

const isBrowser = typeof window !== 'undefined';

export const storage = {
  setAuth(token: string, shadowId: string) {
    if (!isBrowser) return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(SHADOW_ID_KEY, shadowId);
  },
  clearAuth() {
    if (!isBrowser) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SHADOW_ID_KEY);
  },
  getToken(): string | null {
    if (!isBrowser) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getShadowId(): string | null {
    if (!isBrowser) return null;
    return window.localStorage.getItem(SHADOW_ID_KEY);
  }
};
