import type { Metadata } from "next";
import { Philosopher, Geist_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarot Vault",
  description:
    "A digital sanctuary for the cultivation of insight through tarot.",
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
        className={`${philosopher.variable} ${philosopher.className} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider dynamic>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
