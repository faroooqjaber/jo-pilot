import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const [error, setError] = useState("");
  const containerId = "barcode-scanner-container";

  const cleanupScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    if (stopPromiseRef.current) {
      await stopPromiseRef.current;
      return;
    }

    stopPromiseRef.current = (async () => {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore stop errors during fast close/unmount
      }

      try {
        scanner.clear();
      } catch {
        // ignore clear errors if scanner never fully initialized
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
      stopPromiseRef.current = null;
    })();

    await stopPromiseRef.current;
  };

  useEffect(() => {
    if (!open) return;
    setError("");

    const timeout = window.setTimeout(() => {
      const el = document.getElementById(containerId);
      if (!el || scannerRef.current) {
        if (!el) setError(dir === "rtl" ? "لا يمكن تحميل الماسح" : "Cannot load scanner");
        return;
      }

      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 30, qrbox: { width: 320, height: 100 }, aspectRatio: 3.0, disableFlip: false },
          async (decodedText) => {
            onScan(decodedText);
            await cleanupScanner();
            onClose();
          },
          () => {}
        )
        .catch(() => {
          setError(dir === "rtl" ? "لا يمكن الوصول إلى الكاميرا" : "Cannot access camera");
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      void cleanupScanner();
    };
  }, [open, dir, onClose, onScan]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-4" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Camera className="w-4 h-4" />
            {dir === "rtl" ? "مسح الباركود" : "Scan Barcode"}
          </DialogTitle>
        </DialogHeader>
        <div id={containerId} className="w-full min-h-[200px] rounded-lg overflow-hidden" />
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <Button variant="outline" onClick={onClose} className="w-full gap-2">
          <X className="w-4 h-4" />
          {t("cancel")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}