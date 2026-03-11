import type { Metadata } from "next";
import { Philosopher, Nunito } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

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

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarot Vault",
  description:
    "A tarot app. You do readings. It keeps track of them.",
  icons: {
    icon: "/diamond-2.svg",
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
        className={`${philosopher.variable} ${nunito.variable} ${nunito.className} ${jetbrainsMono.variable} antialiased`}
      >
        <ClerkProvider dynamic>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <ConvexClientProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ConvexClientProvider>
        </ThemeProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
