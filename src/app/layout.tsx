import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

import { dark } from "@clerk/themes";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TradeJournal — Log every trade",
  description:
    "A fast, dark trading journal. Log every trade, track your P&L, analyze your strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#2a7aff",
          colorBackground: "#12161c",
          colorInputBackground: "#181d25",
          colorText: "#e4e8ef",
          colorTextSecondary: "#6b7a90",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${outfit.variable} ${jetbrainsMono.variable}`}
      >
        <body className="min-h-full antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
