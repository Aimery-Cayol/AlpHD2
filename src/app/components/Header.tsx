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
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-slate-900 hover:text-blue-600 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Accueil
            </Link>
            
            <Link
              href="/zonesdispos"
              className="text-slate-500 hover:text-blue-600 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Zones disponibles
            </Link>
            
            <Link
              href="/relief+"
              className="text-slate-500 hover:text-blue-600 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Relief+
            </Link>

            <Link
              href="/about"
              className="text-slate-500 hover:text-blue-600 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              À propos
            </Link>
          </nav>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white animate-in slide-in-from-top duration-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-black uppercase text-slate-900 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              
              <Link
                href="/zonesdispos"
                className="block px-3 py-2 text-base font-black uppercase text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Zones disponibles
              </Link>
              
              <Link
                href="/relief+"
                className="block px-3 py-2 text-base font-black uppercase text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Relief+
              </Link>
              
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-black uppercase text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
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
