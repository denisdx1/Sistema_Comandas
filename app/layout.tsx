import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sistema de Comandas",
    template: "%s | Sistema de Comandas",
  },
  description: "Sistema integral de gestión de comandas para restaurantes. Gestiona productos, categorías, usuarios y órdenes de manera eficiente.",
  keywords: ["restaurante", "comandas", "gestión", "órdenes", "productos", "categorías"],
  authors: [{ name: "Sistema de Comandas" }],
  creator: "Sistema de Comandas",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "http://localhost:3000",
    title: "Sistema de Comandas",
    description: "Sistema integral de gestión de comandas para restaurantes",
    siteName: "Sistema de Comandas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Comandas",
    description: "Sistema integral de gestión de comandas para restaurantes",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
