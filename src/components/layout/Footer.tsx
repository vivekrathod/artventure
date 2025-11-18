import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-playfair text-2xl font-bold text-gray-900">
              ArtVenture
            </h3>
            <p className="mt-4 text-gray-600">
              Handcrafted beaded jewelry made with love and attention to detail.
              Each piece is unique and tells its own story.
            </p>
            <div className="mt-6 flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 transition-colors hover:text-rose-600"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 transition-colors hover:text-rose-600"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 transition-colors hover:text-rose-600"
              >
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-gray-900">Customer Service</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/account"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  Order History
                </Link>
              </li>
              <li>
                <Link
                  href="/care-instructions"
                  className="text-gray-600 transition-colors hover:text-rose-600"
                >
                  Care Instructions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} ArtVenture. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
