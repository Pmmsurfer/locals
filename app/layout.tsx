import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { PostSessionProvider } from "@/contexts/PostSessionContext";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Locals",
  description: "Find your crew for running, cycling, and surfing nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${nunito.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        <PostSessionProvider>{children}</PostSessionProvider>
      </body>
    </html>
  );
}
