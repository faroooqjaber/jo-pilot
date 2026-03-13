import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Language = "ar" | "en";

const translations = {
  // General
  storeName: { ar: "JO Shops", en: "JO Shops" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  delete: { ar: "حذف", en: "Delete" },
  edit: { ar: "تعديل", en: "Edit" },
  add: { ar: "إضافة", en: "Add" },
  search: { ar: "بحث", en: "Search" },

  // Nav
  navPOS: { ar: "نقطة البيع", en: "Point of Sale" },
  navProducts: { ar: "المنتجات", en: "Products" },
  navDashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  navReports: { ar: "التقارير", en: "Reports" },
  navSettings: { ar: "الإعدادات", en: "Settings" },
  lightMode: { ar: "الوضع الفاتح", en: "Light Mode" },
  darkMode: { ar: "الوضع الداكن", en: "Dark Mode" },

  // POS Page
  currentCart: { ar: "السلة الحالية", en: "Current Cart" },
  cartEmpty: { ar: "السلة فارغة", en: "Cart is empty" },
  clickToAdd: { ar: "اضغط على منتج لإضافته", en: "Click a product to add it" },
  items: { ar: "صنف", en: "items" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
  vat: { ar: "ضريبة المبيعات", en: "Sales Tax" },
  grandTotal: { ar: "الإجمالي", en: "Grand Total" },
  finalizeSale: { ar: "إتمام البيع", en: "Finalize Sale" },
  print: { ar: "طباعة", en: "Print" },
  saveAsImage: { ar: "حفظ كصورة", en: "Save as Image" },
  searchByNameOrBarcode: { ar: "ابحث بالاسم أو الباركود...", en: "Search by name or barcode..." },
  outOfStock: { ar: "نفذ من المخزون", en: "Out of Stock" },
  lowStock: { ar: "منخفض", en: "Low Stock" },
  stock: { ar: "المخزون", en: "Stock" },
  remaining: { ar: "متبقي", en: "remaining" },
  productNotAvailable: { ar: "المنتج غير متوفر في المخزون", en: "Product is out of stock" },
  cannotExceedStock: { ar: "لا يمكن تجاوز الكمية المتوفرة", en: "Cannot exceed available quantity" },
  saleCompleted: { ar: "تم إتمام عملية البيع بنجاح!", en: "Sale completed successfully!" },
  receiptSaved: { ar: "تم حفظ الفاتورة كصورة!", en: "Receipt saved as image!" },
  receiptSaveFailed: { ar: "فشل حفظ الفاتورة كصورة", en: "Failed to save receipt as image" },

  // Products Page
  productManagement: { ar: "إدارة المنتجات", en: "Product Management" },
  addProduct: { ar: "إضافة منتج", en: "Add Product" },
  editProduct: { ar: "تعديل المنتج", en: "Edit Product" },
  addNewProduct: { ar: "إضافة منتج جديد", en: "Add New Product" },
  productName: { ar: "اسم المنتج", en: "Product Name" },
  category: { ar: "الفئة", en: "Category" },
  salePrice: { ar: "سعر البيع", en: "Sale Price" },
  costPrice: { ar: "سعر التكلفة", en: "Cost Price" },
  quantity: { ar: "الكمية", en: "Quantity" },
  alertThreshold: { ar: "حد التنبيه", en: "Alert Threshold" },
  saveChanges: { ar: "حفظ التعديلات", en: "Save Changes" },
  productAdded: { ar: "تم إضافة المنتج وتوليد الباركود تلقائياً", en: "Product added with auto-generated barcode" },
  productUpdated: { ar: "تم تحديث المنتج", en: "Product updated" },
  productDeleted: { ar: "تم حذف المنتج", en: "Product deleted" },
  noProducts: { ar: "لا توجد منتجات بعد. اضغط \"إضافة منتج\" للبدء", en: "No products yet. Click \"Add Product\" to start" },
  noResults: { ar: "لا توجد نتائج", en: "No results" },
  noMatchingProducts: { ar: "لا توجد منتجات مطابقة للبحث", en: "No products matching search" },
  depleted: { ar: "نفذ", en: "Depleted" },
  productNamePlaceholder: { ar: "مثال: حليب طازج", en: "e.g. Fresh Milk" },

  // Categories
  catBeverages: { ar: "مشروبات", en: "Beverages" },
  catFood: { ar: "مواد غذائية", en: "Food" },
  catCleaning: { ar: "منظفات", en: "Cleaning" },
  catElectronics: { ar: "إلكترونيات", en: "Electronics" },
  catClothing: { ar: "ملابس", en: "Clothing" },
  catOther: { ar: "أخرى", en: "Other" },

  // Dashboard
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  todayTotalSales: { ar: "إجمالي مبيعات اليوم", en: "Today's Total Sales" },
  todaySalesOps: { ar: "عمليات البيع اليوم", en: "Today's Transactions" },
  lowStockProducts: { ar: "منتجات منخفضة المخزون", en: "Low Stock Products" },
  stockAlerts: { ar: "تنبيهات المخزون", en: "Stock Alerts" },
  allStocked: { ar: "جميع المنتجات متوفرة بكميات كافية ✓", en: "All products are well stocked ✓" },
  recentTransactions: { ar: "آخر العمليات", en: "Recent Transactions" },
  noTransactionsYet: { ar: "لا توجد عمليات بيع بعد", en: "No transactions yet" },

  // Settings
  storeSettings: { ar: "إعدادات المتجر", en: "Store Settings" },
  storeNameLabel: { ar: "اسم المتجر", en: "Store Name" },
  storeNamePlaceholder: { ar: "أدخل اسم المتجر", en: "Enter store name" },
  storeLogo: { ar: "شعار المتجر", en: "Store Logo" },
  uploadImage: { ar: "رفع صورة", en: "Upload Image" },
  removeLogo: { ar: "إزالة الشعار", en: "Remove Logo" },
  logoHint: { ar: "يُستخدم في الفاتورة والقائمة الجانبية. الحد الأقصى 2 ميجابايت.", en: "Used in receipts and sidebar. Max 2MB." },
  imageTooLarge: { ar: "حجم الصورة يجب أن لا يتجاوز 2 ميجابايت", en: "Image must be under 2MB" },
  currency: { ar: "العملة", en: "Currency" },
  jordanianDinar: { ar: "دينار أردني (د.أ)", en: "Jordanian Dinar (JOD)" },
  vatRate: { ar: "نسبة ضريبة المبيعات (%)", en: "Sales Tax Rate (%)" },
  vatHint: { ar: "أدخل 0 لتعطيل الضريبة", en: "Enter 0 to disable tax" },
  jordanVatHint: { ar: "ضريبة الأردن الافتراضية 16%. عند تعديلها سيتم إشعار التاجر.", en: "Jordan default tax is 16%. Merchant gets notified on changes." },
  saveSettings: { ar: "حفظ الإعدادات", en: "Save Settings" },
  settingsSaved: { ar: "تم حفظ الإعدادات بنجاح!", en: "Settings saved successfully!" },
  storeNameRequired: { ar: "اسم المتجر مطلوب", en: "Store name is required" },
  vatRangeError: { ar: "نسبة الضريبة يجب أن تكون بين 0 و 100", en: "Tax rate must be between 0 and 100" },
  vatUpdatedMerchantNotice: {
    ar: "تم تحديث ضريبة الأردن، يرجى إشعار التاجر ومراجعة الالتزام الضريبي.",
    en: "Jordan tax was updated. Please notify the merchant and review tax compliance.",
  },
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },

  // Receipt
  simplifiedTaxInvoice: { ar: "فاتورة ضريبية مبسطة", en: "Simplified Tax Invoice" },
  receiptNum: { ar: "رقم", en: "No." },
  item: { ar: "الصنف", en: "Item" },
  qty: { ar: "الكمية", en: "Qty" },
  amount: { ar: "المبلغ", en: "Amount" },
  thankYou: { ar: "شكراً لزيارتكم!", en: "Thank you for visiting!" },
  happyToServe: { ar: "نسعد بخدمتكم دائماً", en: "We're happy to serve you" },

  // Reports
  reports: { ar: "التقارير والتحليلات", en: "Reports & Analytics" },
  totalSales: { ar: "إجمالي المبيعات", en: "Total Sales" },
  totalOrders: { ar: "إجمالي الطلبات", en: "Total Orders" },
  avgOrderValue: { ar: "متوسط قيمة الطلب", en: "Avg Order Value" },
  totalProfit: { ar: "إجمالي الأرباح", en: "Total Profit" },
  salesOverview: { ar: "نظرة عامة على المبيعات", en: "Sales Overview" },
  topSellingProducts: { ar: "المنتجات الأكثر مبيعاً", en: "Top Selling Products" },
  categoryDistribution: { ar: "توزيع المبيعات حسب الفئة", en: "Sales by Category" },
  daily: { ar: "يومي", en: "Daily" },
  weekly: { ar: "أسبوعي", en: "Weekly" },
  monthly: { ar: "شهري", en: "Monthly" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  unitsSold: { ar: "وحدات مباعة", en: "Units Sold" },
  noDataAvailable: { ar: "لا توجد بيانات متاحة", en: "No data available" },

  // Not Found
  pageNotFound: { ar: "عذراً، الصفحة غير موجودة", en: "Oops! Page not found" },
  returnToHome: { ar: "العودة للرئيسية", en: "Return to Home" },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextType>({
  lang: "ar",
  setLang: () => {},
  t: (key) => translations[key]?.ar || key,
  dir: "rtl",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return (localStorage.getItem("pos_lang") as Language) || "ar";
    } catch {
      return "ar";
    }
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem("pos_lang", l);
    } catch {
      // no-op for private mode or restricted storage
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
