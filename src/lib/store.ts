import { getStoreSettings, JORDAN_DEFAULT_VAT_RATE } from "@/lib/store-settings";

// POS Data Store using localStorage for persistence
// Barcode Generation: Uses EAN-13 format with auto-generated check digit

export interface Product {
  id: string;
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  barcode: string;
  lowStockThreshold: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  receiptNumber?: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}

const PRODUCTS_KEY = 'pos_products';
const TRANSACTIONS_KEY = 'pos_transactions';
const RECEIPT_COUNTER_KEY = 'pos_daily_receipt_counter';

// VAT_RATE is now dynamic from store settings
function getVatRate(): number {
  try {
    return getStoreSettings().vatRate / 100;
  } catch {
    return JORDAN_DEFAULT_VAT_RATE / 100;
  }
}

function getReceiptDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextDailyReceiptNumber(now: Date): number {
  const dateKey = getReceiptDateKey(now);

  try {
    const raw = localStorage.getItem(RECEIPT_COUNTER_KEY);
    const parsed = raw ? (JSON.parse(raw) as { dateKey?: string; lastNumber?: number }) : null;

    const currentDateKey = parsed?.dateKey;
    const currentLastNumber = Number(parsed?.lastNumber) || 0;

    const nextNumber = currentDateKey === dateKey ? currentLastNumber + 1 : 1;

    localStorage.setItem(
      RECEIPT_COUNTER_KEY,
      JSON.stringify({
        dateKey,
        lastNumber: nextNumber,
      }),
    );

    return nextNumber;
  } catch {
    return 1;
  }
}

export function getTransactionReceiptNumber(transaction: Transaction): number {
  if (typeof transaction.receiptNumber === "number" && transaction.receiptNumber > 0) {
    return transaction.receiptNumber;
  }

  const transactionDate = new Date(transaction.date).toDateString();
  const sameDay = getTransactions()
    .filter((t) => new Date(t.date).toDateString() === transactionDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const index = sameDay.findIndex((t) => t.id === transaction.id);
  return index >= 0 ? index + 1 : 1;
}

/**
 * Generates a unique EAN-13 barcode.
 * EAN-13 consists of 12 digits + 1 check digit.
 * We use prefix "200" (in-store use range) + random 9 digits + check digit.
 */
export function generateEAN13(): string {
  // "200" prefix is reserved for in-store use
  let code = "200";
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }

  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

// Products CRUD
export function getProducts(): Product[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt'> & { barcode?: string }): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    barcode: product.barcode || generateEAN13(),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

// Transactions
export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransaction(items: CartItem[]): Transaction {
  const subtotal = items.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const tax = subtotal * getVatRate();
  const total = subtotal + tax;
  const now = new Date();

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    receiptNumber: getNextDailyReceiptNumber(now),
    items,
    subtotal,
    tax,
    total,
    date: now.toISOString(),
  };

  // Save transaction
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

  // Deduct stock
  const products = getProducts();
  items.forEach(item => {
    const product = products.find(p => p.id === item.product.id);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  });
  saveProducts(products);

  return transaction;
}

export function getTodayStats() {
  const today = new Date().toDateString();
  const transactions = getTransactions().filter(
    t => new Date(t.date).toDateString() === today
  );
  return {
    totalSales: transactions.reduce((sum, t) => sum + t.total, 0),
    totalTransactions: transactions.length,
  };
}

export function getLowStockProducts(): Product[] {
  return getProducts().filter(p => p.stock <= p.lowStockThreshold);
}

export function getVatPercentage(): number {
  return getVatRate() * 100;
}
export { getVatRate };
