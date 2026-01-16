"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Mountain } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Mountain className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Alp<span className="text-blue-600">HD</span>
              </span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/zonesdispos"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Zones disponibles
            </Link>
            <Link
              href="/relief+"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Relief+
            </Link>

            <Link
              href="/about"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              À propos
            </Link>
          </nav>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/zonesdispos"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Zones disponibles
              </Link>
              <Link
                href="/relief+"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Relief+
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                À propos
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
