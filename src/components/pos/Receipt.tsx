import { forwardRef } from "react";
import { Transaction, getTransactionReceiptNumber } from "@/lib/store";
import { getStoreSettings, JOD_CURRENCY } from "@/lib/store-settings";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ShoppingCart } from "lucide-react";

interface Props {
  transaction: Transaction;
}

const Receipt = forwardRef<HTMLDivElement, Props>(({ transaction }, ref) => {
  const { t, lang, dir } = useI18n();
  const settings = getStoreSettings();
  const currencySymbol = JOD_CURRENCY.symbol;
  const fmt = (n: number) => `${n.toFixed(2)} ${currencySymbol}`;
  const locale = lang === "ar" ? ar : enUS;
  const receiptNumber = getTransactionReceiptNumber(transaction);

  return (
    <div ref={ref} className="receipt-print bg-card p-6 w-[80mm] mx-auto font-mono-code text-xs text-card-foreground" dir={dir}>
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-muted">
          {settings.storeLogo ? (
            <img src={settings.storeLogo} alt={settings.storeName} className="w-full h-full object-cover" />
          ) : (
            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-base font-bold">{settings.storeName}</h2>
        <p className="text-muted-foreground mt-1">
          {format(new Date(transaction.date), "yyyy/MM/dd - HH:mm", { locale })}
        </p>
        <p className="text-muted-foreground">{t("receiptNum")}: {receiptNumber}</p>
      </div>

      <div className="border-t border-dashed border-border my-2" />

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={`${dir === "rtl" ? "text-right" : "text-left"} py-1`}>{t("item")}</th>
            <th className="text-center py-1">{t("qty")}</th>
            <th className={`${dir === "rtl" ? "text-left" : "text-right"} py-1`}>{t("amount")}</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items.map((item, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className={`py-1 ${dir === "rtl" ? "text-right" : "text-left"}`}>{item.product.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className={`py-1 ${dir === "rtl" ? "text-left" : "text-right"}`}>{fmt(item.product.salePrice * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-border my-2" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>{t("subtotal")}:</span>
          <span>{fmt(transaction.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("vat")} ({settings.vatRate}%):</span>
          <span>{fmt(transaction.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-border pt-1">
          <span>{t("grandTotal")}:</span>
          <span>{fmt(transaction.total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border my-3" />

      <div className="text-center text-muted-foreground">
        <p>{t("thankYou")}</p>
        <p>{t("happyToServe")}</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;
