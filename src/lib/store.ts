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
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}

const PRODUCTS_KEY = 'pos_products';
const TRANSACTIONS_KEY = 'pos_transactions';
// VAT_RATE is now dynamic from store settings
function getVatRate(): number {
  try {
    const data = localStorage.getItem('pos_store_settings');
    if (data) {
      const settings = JSON.parse(data);
      return (settings.vatRate ?? 15) / 100;
    }
  } catch {}
  return 0.15;
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

export function addProduct(product: Omit<Product, 'id' | 'barcode' | 'createdAt'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    barcode: generateEAN13(),
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

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    items,
    subtotal,
    tax,
    total,
    date: new Date().toISOString(),
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
