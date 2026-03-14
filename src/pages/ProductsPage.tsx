import { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from "@/lib/store";
import { JOD_CURRENCY } from "@/lib/store-settings";
import { getLocalizedCategoryLabel } from "@/lib/product-categories";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import ProductForm from "@/components/pos/ProductForm";
import BarcodeDisplay from "@/components/pos/BarcodeDisplay";
import { toast } from "sonner";

export default function ProductsPage() {
  const { t } = useI18n();
  const cs = JOD_CURRENCY.symbol;
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const reload = () => setProducts(getProducts());
  useEffect(reload, []);

  const query = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const localizedCategory = getLocalizedCategoryLabel(p.category, t).toLowerCase();
    return p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query) || localizedCategory.includes(query);
  });

  const handleAdd = (data: Parameters<typeof addProduct>[0]) => { addProduct(data); reload(); toast.success(t("productAdded")); };
  const handleEdit = (data: Parameters<typeof addProduct>[0]) => { if (!editing) return; updateProduct(editing.id, data); setEditing(null); reload(); toast.success(t("productUpdated")); };
  const handleDelete = (id: string) => { deleteProduct(id); reload(); toast.success(t("productDeleted")); };

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("productManagement")}</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2 h-10 px-5 font-semibold text-sm">
          <Plus className="w-4 h-4" />
          {t("addProduct")}
        </Button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("searchByNameOrBarcode")} value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-10 bg-card text-sm" />
      </div>

      <div className="grid gap-3">
        {filtered.map(product => {
          const lowStock = product.stock <= product.lowStockThreshold;
          const outOfStock = product.stock <= 0;
          return (
            <div key={product.id} className="group bg-card border border-border rounded-xl p-4 pos-shadow hover:pos-shadow-hover transition-all duration-300 animate-fade-in flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-[15px]">{product.name}</h3>
                  {(lowStock || outOfStock) && (
                    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${outOfStock ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {outOfStock ? t("depleted") : t("lowStock")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{getLocalizedCategoryLabel(product.category, t)}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-foreground">{t("salePrice")}: <strong className="text-primary">{product.salePrice.toFixed(2)} {cs}</strong></span>
                  <span className="text-muted-foreground">{t("costPrice")}: {product.costPrice.toFixed(2)} {cs}</span>
                  <span className={`font-medium ${outOfStock ? "text-destructive" : lowStock ? "text-warning" : "text-success"}`}>
                    {t("stock")}: {product.stock}
                  </span>
                </div>
              </div>

              <div className="shrink-0"><BarcodeDisplay value={product.barcode} height={35} width={1.5} /></div>

              <div className="flex gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-primary/10 hover:text-primary" onClick={() => { setEditing(product); setFormOpen(true); }}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {products.length === 0 ? t("noProducts") : t("noResults")}
          </div>
        )}
      </div>

      <ProductForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={editing ? handleEdit : handleAdd} initial={editing} />
    </div>
  );
}
