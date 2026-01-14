import type { Metadata } from "next";
import { Bungee, Fredoka } from "next/font/google";
import "./globals.css";

const displayFont = Bungee({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Fredoka({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Words Drop",
  description: "Swipe, earn words, and watch the tiles fall together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
