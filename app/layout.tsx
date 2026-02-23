import type { Metadata } from "next";
import { Philosopher, Nunito } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const philosopher = Philosopher({
  weight: ["400", "700"],
  variable: "--font-philosopher",
  subsets: ["latin"],
});

const nunito = Nunito({
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarot Vault",
  description:
    "A tarot app. You do readings. It keeps track of them.",
  icons: {
    icon: "/diamond.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${philosopher.variable} ${nunito.variable} ${nunito.className} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider dynamic>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
