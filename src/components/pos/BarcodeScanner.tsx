import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Camera, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: Props) {
  const { t, dir } = useI18n();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");
  const containerId = "barcode-scanner-container";

  useEffect(() => {
    if (!open) return;
    setError("");

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 280, height: 160 } },
      (decodedText) => {
        onScan(decodedText);
        scanner.stop().catch(() => {});
        onClose();
      },
      () => {} // ignore scan failures
    ).catch(() => {
      setError(dir === "rtl" ? "لا يمكن الوصول إلى الكاميرا" : "Cannot access camera");
    });

    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-4" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Camera className="w-4 h-4" />
            {dir === "rtl" ? "مسح الباركود" : "Scan Barcode"}
          </DialogTitle>
        </DialogHeader>
        <div id={containerId} className="w-full rounded-lg overflow-hidden" />
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <Button variant="outline" onClick={onClose} className="w-full gap-2">
          <X className="w-4 h-4" />
          {t("cancel")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
