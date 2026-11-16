import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://playaperello.es"),
  title: "Playa del Perelló",
  description: "Estado del mar y oleaje en la Playa del Perelló, Valencia.",
  openGraph: {
    title: "Playa del Perelló",
    description: "Estado del mar y bandera estimada en la Playa del Perelló, Valencia.",
    url: "https://playaperello.es",
    siteName: "Playa del Perelló",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "El Perelló: estado del mar y bandera estimada de la playa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
