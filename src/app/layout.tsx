import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Stockroom | Inventory Management", description: "Inventory operations workspace" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
