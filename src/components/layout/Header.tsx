"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ShoppingCart, Heart, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

export default function Header() {
  const { isSignedIn, user } = useUser();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-playfair text-2xl font-bold text-gray-900"
          >
            Artisan Beads
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/products"
              className="text-gray-700 transition-colors hover:text-rose-600"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-gray-700 transition-colors hover:text-rose-600"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 transition-colors hover:text-rose-600"
            >
              Contact
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            {isSignedIn && (
              <Link
                href="/wishlist"
                className="text-gray-700 transition-colors hover:text-rose-600"
              >
                <Heart className="h-6 w-6" />
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative text-gray-700 transition-colors hover:text-rose-600"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Button or Sign In */}
            {isSignedIn ? (
              <>
                <UserButton afterSignOutUrl="/" />
                {user?.publicMetadata?.isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white transition-colors hover:bg-rose-700"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-4">
              <Link
                href="/products"
                className="text-gray-700 transition-colors hover:text-rose-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/about"
                className="text-gray-700 transition-colors hover:text-rose-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 transition-colors hover:text-rose-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
