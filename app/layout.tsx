import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Satirical Commons",
  description: "Bilingual satire publishing platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
