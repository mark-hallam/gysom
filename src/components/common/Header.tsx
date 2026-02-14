"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-bold tracking-tight text-white">
            GYSOM
          </span>
          <span className="hidden text-xs text-gray-500 sm:inline">
            Get Your Skates On, Mate
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Compile
          </Link>
          <a
            href="https://github.com/mark-hallam/gysom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
