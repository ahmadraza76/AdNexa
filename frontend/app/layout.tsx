import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdNexa — Advertising Infrastructure",
  description: "A transparent advertising network for publishers and advertisers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
