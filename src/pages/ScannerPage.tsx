import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useInventory } from '../context/InventoryContext';

export function ScannerPage() {
  const navigate = useNavigate();
  const { activeList, addItemFromScan } = useInventory();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Scanner may already be stopped
      }
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      if (now - lastScanTimeRef.current < 2000) return;
      lastScanTimeRef.current = now;

      addItemFromScan(decodedText);
      setLastScan(decodedText);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      navigator.vibrate?.(100);
    },
    [addItemFromScan],
  );

  const startScanner = useCallback(async () => {
    setError(null);

    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1,
        },
        handleScan,
        () => {
          // Ignore scan failures while searching
        },
      );

      setScanning(true);
    } catch {
      setError('Camera access denied or unavailable. Please allow camera permissions.');
    }
  }, [handleScan]);

  useEffect(() => {
    startScanner();
    return () => {
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="page scanner-page">
      <Header title="Scan" showBack backTo="/" />

      <div className="scanner-info">
        Adding to: <strong>{activeList.name}</strong>
      </div>

      <div className={`scanner-wrapper ${flash ? 'flash' : ''}`}>
        <div id="scanner-region" className="scanner-region" />
        {!scanning && !error && <p className="scanner-loading">Starting camera…</p>}
      </div>

      {error && (
        <div className="scanner-error">
          <p>{error}</p>
          <Button onClick={startScanner}>Try Again</Button>
        </div>
      )}

      {lastScan && (
        <div className="scan-result">
          <span className="scan-result-label">Last scanned:</span>
          <code>{lastScan}</code>
        </div>
      )}

      <div className="scanner-actions">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Done
        </Button>
      </div>
    </div>
  );
}
