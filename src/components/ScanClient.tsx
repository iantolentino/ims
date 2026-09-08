"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanIcon } from "./ScanIcon";

type Detector = { detect(source: unknown): Promise<Array<{ rawValue?: string }>> };

export default function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTimeoutRef = useRef<number | null>(null);
  const activeRef = useRef(true);
  const detectingRef = useRef(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Starting camera…");
  const [error, setError] = useState("");

  useEffect(() => {
    activeRef.current = true;
    void startCamera();
    return () => { activeRef.current = false; if (cameraTimeoutRef.current) window.clearTimeout(cameraTimeoutRef.current); stopCamera(); };
    // Camera starts once when the Scan screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    cameraTimeoutRef.current = window.setTimeout(() => {
      if (!cameraReady) {
        setAutoDetect(false);
        setError("Camera access did not respond. Use manual entry or a connected scanner gun instead.");
        setMessage("Manual entry is ready.");
      }
    }, 4000);
    if (!navigator.mediaDevices?.getUserMedia) {
      setAutoDetect(false);
      setMessage("Camera access is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (!activeRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      if (cameraTimeoutRef.current) window.clearTimeout(cameraTimeoutRef.current);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraReady(true);
      const DetectorClass = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => Detector }).BarcodeDetector;
      if (!DetectorClass) { setAutoDetect(false); setMessage("Camera is ready. Use manual code entry for this browser."); return; }
      setMessage("Point the camera at a product, bin, or asset code.");
      detect(new DetectorClass());
    } catch {
      setAutoDetect(false);
      setError("Camera permission was denied or the camera is busy. Enter the code below instead.");
      setMessage("Manual entry is ready.");
    }
  }

  async function detect(detector: Detector) {
    if (!activeRef.current || !videoRef.current) return;
    if (!detectingRef.current && videoRef.current.readyState >= 2) {
      detectingRef.current = true;
      try {
        const codes = await detector.detect(videoRef.current);
        const value = codes.find((code) => code.rawValue)?.rawValue;
        if (value) await resolveCode(value);
      } catch { /* Keep the camera alive; manual fallback remains available. */ }
      detectingRef.current = false;
    }
    if (activeRef.current) window.requestAnimationFrame(() => void detect(detector));
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function resolveCode(code: string) {
    const normalized = code.trim();
    if (!normalized || busy) return;
    setBusy(true); setError(""); setMessage(`Looking up ${normalized}…`);
    const response = await fetch(`/api/scan?code=${encodeURIComponent(normalized)}`);
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Code not found."); setMessage("Try another code or enter it manually."); setBusy(false); detectingRef.current = false; return; }
    stopCamera();
    activeRef.current = false;
    router.push(data.url);
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void resolveCode(manualCode); }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="eyebrow">Live camera</p><h2 className="mt-1 text-lg font-bold">Scan without a shutter</h2></div><span className={`flex items-center gap-2 text-xs font-bold ${cameraReady ? "text-accent" : "text-muted"}`}><span className={`h-2 w-2 rounded-full ${cameraReady ? "bg-accent" : "bg-muted"}`} />{cameraReady ? "Camera active" : "Waiting"}</span></div>
      <div className="relative aspect-square max-h-[min(68vh,620px)] bg-[#111a17] sm:aspect-[4/3]"><video ref={videoRef} muted playsInline autoPlay aria-label="Camera view for scanning inventory codes" className="h-full w-full object-cover" /><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="relative h-52 w-64 border-2 border-white/80 sm:h-64 sm:w-80"><span className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-accent" /><span className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-accent" /><span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-accent" /><span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-accent" /></div></div>{busy && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">Opening item…</div>}</div>
      <div className="flex items-start gap-3 px-5 py-4 text-sm text-muted"><ScanIcon size={20} /><p>{message}<br /><span className="text-xs">Products, warehouse bins, and physical asset tags use the same scan flow.</span></p></div>
    </section>
    <aside className="space-y-4">
      <section className="panel p-5"><p className="eyebrow">Fallback</p><h2 className="mt-1 text-lg font-bold">Enter a code</h2><p className="mt-2 text-sm leading-5 text-muted">Type a code or use a USB/Bluetooth scanner gun. Press Enter to open the matching record.</p><form onSubmit={submit} className="mt-5 space-y-3"><label className="block text-sm font-bold" htmlFor="scan-code">Barcode, QR, or asset tag</label><input id="scan-code" className="input min-h-12 font-mono" autoFocus value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="e.g. 480000000001" autoComplete="off" /><button disabled={busy || !manualCode.trim()} className="button-primary flex min-h-11 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"><ScanIcon size={18} />{busy ? "Looking up…" : "Open item"}</button></form>{error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}</section>
      <section className="rounded-lg border border-[#c9ddd4] bg-[#edf6f1] p-5"><p className="text-sm font-bold text-accent">Quick test codes</p><p className="mt-2 text-xs leading-5 text-[#426e5c]">Seed data includes product barcodes beginning with <code>480000</code>, locations <code>A-01</code> / <code>C-01</code>, and asset tags such as <code>AST-SCAN-001</code>.</p></section>
    </aside>
  </div>;
}
