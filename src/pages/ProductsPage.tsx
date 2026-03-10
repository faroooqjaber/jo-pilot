import { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from "@/lib/store";
import { getStoreSettings, CURRENCIES } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import ProductForm from "@/components/pos/ProductForm";
import BarcodeDisplay from "@/components/pos/BarcodeDisplay";
import { toast } from "sonner";

export default function ProductsPage() {
  const { t } = useI18n();
  const settings = getStoreSettings();
  const cs = CURRENCIES.find(c => c.code === settings.currency)?.symbol ?? "ر.س";
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const reload = () => setProducts(getProducts());
  useEffect(reload, []);

  const filtered = products.filter(p =>
    p.name.includes(search) || p.barcode.includes(search) || p.category.includes(search)
  );

  const handleAdd = (data: Parameters<typeof addProduct>[0]) => {
    addProduct(data);
    reload();
    toast.success(t("productAdded"));
  };

  const handleEdit = (data: Parameters<typeof addProduct>[0]) => {
    if (!editing) return;
    updateProduct(editing.id, data);
    setEditing(null);
    reload();
    toast.success(t("productUpdated"));
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    reload();
    toast.success(t("productDeleted"));
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("productManagement")}</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="touch-target gap-2">
          <Plus className="w-5 h-5" />
          {t("addProduct")}
        </Button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("searchByNameOrBarcode")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10 touch-target"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map(product => {
          const lowStock = product.stock <= product.lowStockThreshold;
          const outOfStock = product.stock <= 0;
          return (
            <div key={product.id} className="bg-card border border-border rounded-xl p-4 pos-shadow animate-fade-in flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{product.name}</h3>
                  {(lowStock || outOfStock) && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${outOfStock ? "bg-destructive/10 text-danger" : "bg-accent/10 text-warning"}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {outOfStock ? t("depleted") : t("lowStock")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-foreground">{t("salePrice")}: <strong className="text-primary">{product.salePrice.toFixed(2)} {cs}</strong></span>
                  <span className="text-muted-foreground">{t("costPrice")}: {product.costPrice.toFixed(2)} {cs}</span>
                  <span className={`${outOfStock ? "text-danger" : lowStock ? "text-warning" : "text-success"}`}>
                    {t("stock")}: {product.stock}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <BarcodeDisplay value={product.barcode} height={35} width={1.5} />
              </div>

              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" className="touch-target" onClick={() => { setEditing(product); setFormOpen(true); }}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="touch-target text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {products.length === 0 ? t("noProducts") : t("noResults")}
          </div>
        )}
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={editing ? handleEdit : handleAdd}
        initial={editing}
      />
    </div>
  );
}
