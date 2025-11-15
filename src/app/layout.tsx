import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Artisan Beaded Jewelry | Handcrafted with Love",
  description: "Discover unique, handcrafted beaded jewelry. Each piece is carefully crafted with premium materials and attention to detail.",
  keywords: "handmade jewelry, beaded jewelry, artisan jewelry, handcrafted accessories",
  openGraph: {
    title: "Artisan Beaded Jewelry",
    description: "Handcrafted beaded jewelry made with love",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
