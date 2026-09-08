"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function LabelClient({ code, name, detail }: { code: string; name: string; detail: string }) {
  const [image, setImage] = useState("");
  useEffect(() => { QRCode.toDataURL(code, { margin: 1, width: 280, errorCorrectionLevel: "M" }).then(setImage); }, [code]);
  return <main className="flex min-h-screen items-center justify-center bg-white p-8"><section className="label-card w-[360px] rounded-xl border-2 border-ink bg-white p-6 text-center"><p className="eyebrow">Stockroom identifier</p><h1 className="mt-3 text-2xl font-bold">{name}</h1>{image && <img className="mx-auto mt-5 h-64 w-64" src={image} alt={`QR code for ${code}`} />}<p className="mt-3 font-mono text-xl font-bold tracking-[0.18em]">{code}</p><p className="mt-2 text-sm text-muted">{detail}</p><button className="button-primary mt-6 print:hidden" onClick={() => window.print()}>Print label</button></section></main>;
}
