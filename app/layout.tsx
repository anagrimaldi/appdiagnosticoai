import type { Metadata } from "next";
import "./globals.css";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Diagnóstico IA";

export const metadata: Metadata = {
  title: { default: brand, template: `%s · ${brand}` },
  description: "Diagnóstico de IA y automatización de procesos con n8n",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
