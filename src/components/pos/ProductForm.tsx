import { useState, useEffect } from "react";
import { Product } from "@/lib/store";
import { getStoreSettings, CURRENCIES } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; salePrice: number; costPrice: number; stock: number; lowStockThreshold: number }) => void;
  initial?: Product | null;
}

export default function ProductForm({ open, onClose, onSave, initial }: Props) {
  const { t, dir } = useI18n();
  const cs = CURRENCIES.find(c => c.code === getStoreSettings().currency)?.symbol ?? "ر.س";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("5");

  const categories = [
    t("catBeverages"), t("catFood"), t("catCleaning"),
    t("catElectronics"), t("catClothing"), t("catOther"),
  ];

  // Reset form when initial changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setCategory(initial?.category || categories[0]);
      setSalePrice(initial?.salePrice?.toString() || "");
      setCostPrice(initial?.costPrice?.toString() || "");
      setStock(initial?.stock?.toString() || "");
      setThreshold(initial?.lowStockThreshold?.toString() || "5");
    }
  }, [open, initial]);

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
    });
    onClose();
  };

  return (
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
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full touch-target rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("salePrice")} ({cs})</Label>
              <Input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="touch-target" required />
            </div>
            <div>
              <Label>{t("costPrice")} ({cs})</Label>
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
  );
}
