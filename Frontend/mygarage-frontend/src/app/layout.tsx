import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoFolio",
  description: "All your vehicles, one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} text-foreground min-h-screen antialiased transition-colors duration-300`}>
        <Providers>
          {/* Mobile-first centered container with premium glassmorphism background */}
          <div className="mx-auto min-h-screen max-w-2xl bg-[var(--body-bg)] shadow-premium ring-1 ring-black/5 dark:ring-white/5 transition-colors duration-300">
            <main className="relative">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
