import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "BlockBooster — 이벤트를 블록처럼 만들어보세요",
  description: "부스 이벤트를 쉽게 만들고, 운영하고, 기록하는 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${nunito.variable} antialiased font-nunito`}>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            richColors
            position="bottom-center"
            duration={2500}
            closeButton
            swipeDirections={["left", "right"]}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
