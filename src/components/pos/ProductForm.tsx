import { useState, useEffect } from "react";
import { Product } from "@/lib/store";
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
  onSave: (data: { name: string; category: string; salePrice: number; costPrice: number; stock: number; lowStockThreshold: number; barcode?: string }) => void;
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
    }
  }, [open, initial]);

  const handleScan = (code: string) => {
    setBarcode(code);
    playBeep();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salePrice || !costPrice || !stock) return;
    onSave({
      name,
      category,
      salePrice: parseFloat(salePrice),
      costPrice: parseFloat(costPrice),
      stock: parseInt(stock),
      lowStockThreshold: parseInt(threshold) || 5,
      ...(barcode.trim() ? { barcode: barcode.trim() } : {}),
    });
    onClose();
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
    </>
  );
}
