const SETTINGS_KEY = 'pos_store_settings';

export const JOD_CURRENCY = {
  code: "JOD",
  symbol: "د.أ",
  nameAr: "دينار أردني",
  nameEn: "Jordanian Dinar",
} as const;

export const JORDAN_DEFAULT_VAT_RATE = 16;

export interface StoreSettings {
  storeName: string;
  storeLogo: string | null;
  vatRate: number;
  vatUpdatedAt: string | null;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'كاشير برو',
  storeLogo: null,
  vatRate: JORDAN_DEFAULT_VAT_RATE,
  vatUpdatedAt: null,
};

function normalizeVatRate(vatRate: unknown): number {
  const value = typeof vatRate === "number" ? vatRate : Number(vatRate);
  if (!Number.isFinite(value)) return JORDAN_DEFAULT_VAT_RATE;
  return Math.min(100, Math.max(0, value));
}

export function getStoreSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(data) as Partial<StoreSettings> & { currency?: string };
    const merged: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      vatRate: normalizeVatRate(parsed.vatRate),
      vatUpdatedAt: parsed.vatUpdatedAt ?? null,
    };

    // Migration from older builds (15% default + multi-currency)
    if (!parsed.vatUpdatedAt && (parsed.vatRate === undefined || parsed.vatRate === 15)) {
      merged.vatRate = JORDAN_DEFAULT_VAT_RATE;
    }

    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoreSettings(settings: Partial<StoreSettings>) {
  const current = getStoreSettings();
  const vatChanged = settings.vatRate !== undefined && normalizeVatRate(settings.vatRate) !== current.vatRate;

  const updated: StoreSettings = {
    ...current,
    ...settings,
    vatRate: normalizeVatRate(settings.vatRate ?? current.vatRate),
    vatUpdatedAt: vatChanged ? new Date().toISOString() : current.vatUpdatedAt,
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
