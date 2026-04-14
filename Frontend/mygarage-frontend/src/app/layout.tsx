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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased selection:bg-white/10`}>
        <Providers>
          {/* Mobile-first centered container with premium glassmorphism background */}
          <div className="mx-auto min-h-screen max-w-2xl bg-[#0b0b0c] shadow-[0_0_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
            <main className="relative">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
