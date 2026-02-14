import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GYSOM — Prompt Compiler",
  description:
    "Transform project ideas into agent-first execution plans. Get your skates on, mate.",
  keywords: ["prompt compiler", "AI agents", "execution plans", "DAG", "Claude"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
