import { useState, useEffect } from "react";
import { Product, TaxRate } from "@/lib/store";
import { JOD_CURRENCY } from "@/lib/store-settings";
import {
  PRODUCT_CATEGORY_OPTIONS,
  ProductCategory,
  getCategoryTranslationKey,
  normalizeProductCategory,
} from "@/lib/product-categories";
import { useI18n } from "@/lib/i18n";
import { playBeep } from "@/lib/beep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; salePrice: number; costPrice: number; stock: number; lowStockThreshold: number; barcode?: string; taxRate: TaxRate }) => void;
  initial?: Product | null;
}

export default function ProductForm({ open, onClose, onSave, initial }: Props) {
  const { t, dir } = useI18n();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("beverages");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [barcode, setBarcode] = useState("");
  const [taxRate, setTaxRate] = useState<TaxRate>(16);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setCategory(normalizeProductCategory(initial?.category));
      setSalePrice(initial?.salePrice?.toString() || "");
      setCostPrice(initial?.costPrice?.toString() || "");
      setStock(initial?.stock?.toString() || "");
      setThreshold(initial?.lowStockThreshold?.toString() || "5");
      setBarcode(initial?.barcode || "");
      setTaxRate(initial?.taxRate ?? 16);
    }
  }, [open, initial]);

  const handleScan = (code: string) => {
    setBarcode(code);
    playBeep();
  };

  const [showBarcodeConfirm, setShowBarcodeConfirm] = useState(false);

  const doSave = (autoBarcode: boolean) => {
    onSave({
      name,
      category,
      salePrice: parseFloat(salePrice),
      costPrice: parseFloat(costPrice),
      stock: parseInt(stock),
      lowStockThreshold: parseInt(threshold) || 5,
      taxRate,
      ...(barcode.trim() ? { barcode: barcode.trim() } : autoBarcode ? {} : { barcode: "" }),
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salePrice || !costPrice || !stock) return;
    if (!barcode.trim() && !initial) {
      setShowBarcodeConfirm(true);
      return;
    }
    doSave(false);
  };

  const isAr = dir === "rtl";

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className={dir === "rtl" ? "text-right" : "text-left"}>
              {initial ? t("editProduct") : t("addNewProduct")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("productName")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("productNamePlaceholder")} className="touch-target" required />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <select value={category} onChange={e => setCategory(e.target.value as ProductCategory)} className="w-full touch-target rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{t(getCategoryTranslationKey(option))}</option>
                ))}
              </select>
            </div>

            {/* Optional Barcode field */}
            <div>
              <Label>{isAr ? "رقم الباركود (اختياري)" : "Barcode (Optional)"}</Label>
              <div className="flex gap-2">
                <Input
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder={isAr ? "أدخل أو امسح الباركود" : "Enter or scan barcode"}
                  className="touch-target flex-1"
                />
                <Button type="button" variant="outline" size="icon" className="touch-target shrink-0 h-10 w-10" onClick={() => setScannerOpen(true)}>
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isAr ? "اتركه فارغاً لتوليد باركود تلقائي" : "Leave empty to auto-generate"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("salePrice")} ({JOD_CURRENCY.symbol})</Label>
                <Input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="touch-target" required />
              </div>
              <div>
                <Label>{t("costPrice")} ({JOD_CURRENCY.symbol})</Label>
                <Input type="number" step="0.01" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="touch-target" required />
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <Label>{isAr ? "نسبة الضريبة" : "Tax Rate"}</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {([16, 8, 4, 0] as TaxRate[]).map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTaxRate(rate)}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                      taxRate === rate
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("quantity")}</Label>
                <Input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="touch-target" required />
              </div>
              <div>
                <Label>{t("alertThreshold")}</Label>
                <Input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="touch-target" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 touch-target">{initial ? t("saveChanges") : t("addProduct")}</Button>
              <Button type="button" variant="outline" onClick={onClose} className="touch-target">{t("cancel")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />

      {/* Barcode empty confirmation */}
      <Dialog open={showBarcodeConfirm} onOpenChange={setShowBarcodeConfirm}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle>{isAr ? "الباركود فارغ" : "Barcode is Empty"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "هل تريد إنشاء باركود تلقائي لهذا المنتج، أم ستقوم بمسحه لاحقاً؟"
              : "Do you want to auto-generate a barcode for this product, or will you scan it later?"}
          </p>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => { setShowBarcodeConfirm(false); doSave(true); }} className="flex-1">
              {isAr ? "نعم، إنشاء تلقائي" : "Yes, Auto-generate"}
            </Button>
            <Button variant="outline" onClick={() => { setShowBarcodeConfirm(false); doSave(false); }} className="flex-1">
              {isAr ? "لا، سأضيفه يدوياً" : "No, I'll add manually"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
