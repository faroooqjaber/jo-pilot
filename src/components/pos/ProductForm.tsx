import { useState } from "react";
import { Product } from "@/lib/store";
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

const CATEGORIES = ["مشروبات", "مواد غذائية", "منظفات", "إلكترونيات", "ملابس", "أخرى"];

export default function ProductForm({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [salePrice, setSalePrice] = useState(initial?.salePrice?.toString() || "");
  const [costPrice, setCostPrice] = useState(initial?.costPrice?.toString() || "");
  const [stock, setStock] = useState(initial?.stock?.toString() || "");
  const [threshold, setThreshold] = useState(initial?.lowStockThreshold?.toString() || "5");

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
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{initial ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>اسم المنتج</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: حليب طازج" className="touch-target" required />
          </div>
          <div>
            <Label>الفئة</Label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full touch-target rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>سعر البيع (ر.س)</Label>
              <Input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="touch-target" required />
            </div>
            <div>
              <Label>سعر التكلفة (ر.س)</Label>
              <Input type="number" step="0.01" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="touch-target" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الكمية</Label>
              <Input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="touch-target" required />
            </div>
            <div>
              <Label>حد التنبيه</Label>
              <Input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="touch-target" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 touch-target">{initial ? "حفظ التعديلات" : "إضافة المنتج"}</Button>
            <Button type="button" variant="outline" onClick={onClose} className="touch-target">إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
