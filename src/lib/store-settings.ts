const SETTINGS_KEY = 'pos_store_settings';

export interface StoreSettings {
  storeName: string;
  storeLogo: string | null; // base64 data URL or null
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'كاشير برو',
  storeLogo: null,
};

export function getStoreSettings(): StoreSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: Partial<StoreSettings>) {
  const current = getStoreSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
