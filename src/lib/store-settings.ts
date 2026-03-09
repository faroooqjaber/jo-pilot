const SETTINGS_KEY = 'pos_store_settings';

export interface StoreSettings {
  storeName: string;
  storeLogo: string | null; // base64 data URL or null
  currency: string; // currency symbol/code
  vatRate: number; // VAT rate as percentage (e.g. 15 = 15%)
}

export const CURRENCIES = [
  { code: "SAR", symbol: "ر.س", name: "ريال سعودي" },
  { code: "AED", symbol: "د.إ", name: "درهم إماراتي" },
  { code: "KWD", symbol: "د.ك", name: "دينار كويتي" },
  { code: "BHD", symbol: "د.ب", name: "دينار بحريني" },
  { code: "QAR", symbol: "ر.ق", name: "ريال قطري" },
  { code: "OMR", symbol: "ر.ع", name: "ريال عماني" },
  { code: "EGP", symbol: "ج.م", name: "جنيه مصري" },
  { code: "JOD", symbol: "د.أ", name: "دينار أردني" },
  { code: "IQD", symbol: "د.ع", name: "دينار عراقي" },
  { code: "LBP", symbol: "ل.ل", name: "ليرة لبنانية" },
  { code: "MAD", symbol: "د.م", name: "درهم مغربي" },
  { code: "TND", symbol: "د.ت", name: "دينار تونسي" },
  { code: "DZD", symbol: "د.ج", name: "دينار جزائري" },
  { code: "LYD", symbol: "د.ل", name: "دينار ليبي" },
  { code: "SDG", symbol: "ج.س", name: "جنيه سوداني" },
  { code: "YER", symbol: "ر.ي", name: "ريال يمني" },
  { code: "SYP", symbol: "ل.س", name: "ليرة سورية" },
  { code: "USD", symbol: "$", name: "دولار أمريكي" },
  { code: "EUR", symbol: "€", name: "يورو" },
  { code: "GBP", symbol: "£", name: "جنيه إسترليني" },
  { code: "TRY", symbol: "₺", name: "ليرة تركية" },
  { code: "INR", symbol: "₹", name: "روبية هندية" },
  { code: "PKR", symbol: "₨", name: "روبية باكستانية" },
  { code: "CNY", symbol: "¥", name: "يوان صيني" },
  { code: "JPY", symbol: "¥", name: "ين ياباني" },
  { code: "KRW", symbol: "₩", name: "وون كوري" },
  { code: "MYR", symbol: "RM", name: "رينغيت ماليزي" },
  { code: "IDR", symbol: "Rp", name: "روبية إندونيسية" },
  { code: "NGN", symbol: "₦", name: "نايرا نيجيري" },
  { code: "ZAR", symbol: "R", name: "راند جنوب أفريقي" },
  { code: "BRL", symbol: "R$", name: "ريال برازيلي" },
  { code: "CAD", symbol: "C$", name: "دولار كندي" },
  { code: "AUD", symbol: "A$", name: "دولار أسترالي" },
  { code: "CHF", symbol: "Fr", name: "فرنك سويسري" },
  { code: "RUB", symbol: "₽", name: "روبل روسي" },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'كاشير برو',
  storeLogo: null,
  currency: 'SAR',
  vatRate: 15,
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
