import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Folk Studio",
  description: "Editor de Camisetas com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
