// Load and save each user's application data in Supabase with RLS isolation.
window.cloudDataReady = false;
window.cloudWriteQueue = Promise.resolve();
const CLOUD_KEY_BY_STORAGE = {
  [STORAGE_KEYS.customers]: "customers",
  [STORAGE_KEYS.batches]: "batches",
  [STORAGE_KEYS.orders]: "orders",
  [STORAGE_KEYS.settings]: "settings",
};
window.hydrateUserData = async function(user) {
  const { data, error } = await supabaseClient.from("user_app_data")
    .select("data_key,data").eq("user_id", user.id);
  if (error) throw error;
  const remote = Object.fromEntries((data || []).map((row) => [row.data_key, row.data]));
  const defaults = { customers: [], batches: [], orders: [], settings: {} };
  // Keep a local-only backup when this account has no cloud data yet.
  // Demo/local data is not silently uploaded into a user's account.
  if ((data || []).length === 0) {
    const backupKey = "jastip_local_backup_" + user.id;
    if (!localStorage.getItem(backupKey)) {
      const snapshot = {};
      for (const [storageKey, dataKey] of Object.entries(CLOUD_KEY_BY_STORAGE)) {
        snapshot[dataKey] = JSON.parse(localStorage.getItem(storageKey) || (dataKey === "settings" ? "{}" : "[]"));
      }
      localStorage.setItem(backupKey, JSON.stringify(snapshot));
    }
  }
  for (const [storageKey, dataKey] of Object.entries(CLOUD_KEY_BY_STORAGE)) {
    const value = Object.prototype.hasOwnProperty.call(remote, dataKey) ? remote[dataKey] : defaults[dataKey];
    localStorage.setItem(storageKey, JSON.stringify(value));
  }
  window.cloudDataReady = true;
};
window.queueUserDataWrite = function(storageKey, value) {
  const dataKey = CLOUD_KEY_BY_STORAGE[storageKey];
  if (!dataKey || !window.currentAuthUser) return;
  window.cloudWriteQueue = window.cloudWriteQueue.then(async () => {
    const { error } = await supabaseClient.from("user_app_data").upsert({
      user_id: window.currentAuthUser.id, data_key: dataKey, data: value,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,data_key" });
    if (error) throw error;
  }).catch((error) => {
    console.error("Supabase data save failed:", error);
    if (typeof toast === "function") toast("Gagal menyimpan ke server. Periksa koneksi lalu coba lagi.");
  });
  return window.cloudWriteQueue;
};
window.flushCloudWrites = function() { return window.cloudWriteQueue; };
