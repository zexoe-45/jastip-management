const STORAGE_KEYS = {
  customers: "jastip_customers",
  batches: "jastip_batches",
  orders: "jastip_orders",
  settings: "jastip_settings",
  session: "jastip_session",
};
const Store = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    if (window.currentAuthUser && window.cloudDataReady && typeof window.queueUserDataWrite === "function") {
      window.queueUserDataWrite(key, value);
    }
  },
  remove(key) { localStorage.removeItem(key); },
  clearApp() { Object.values(STORAGE_KEYS).filter((key) => key !== STORAGE_KEYS.session).forEach((key) => localStorage.removeItem(key)); },
};
function isLoggedIn() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.session));
}
