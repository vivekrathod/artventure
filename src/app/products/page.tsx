"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Sparkles, Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  inventory_count: number;
  category: Category | null;
  product_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    display_order: number;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = "/api/products?";
      if (selectedCategory) {
        url += `category=${selectedCategory}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-playfair text-4xl font-bold text-gray-900">
              Shop
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Browse our handcrafted beaded jewelry pieces
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedCategory === ""
                    ? "bg-rose-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedCategory === category.id
                      ? "bg-rose-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="mt-12 text-center">
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                // Get primary image (lowest display_order)
                const images = product.product_images || [];
                const sortedImages = [...images].sort(
                  (a, b) => a.display_order - b.display_order
                );
                const primaryImage = sortedImages[0];

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    className="group"
                    data-testid="product-card"
                  >
                    <div className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg">
                      <div className="relative aspect-square bg-gray-200">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={primaryImage.alt_text || product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Sparkles className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {product.inventory_count === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <span className="text-lg font-semibold text-white">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="mt-1 text-xs text-gray-500">
                            {product.category.name}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                        <p className="mt-2 font-semibold text-rose-600">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 text-center">
              <p className="text-gray-600">
                No products found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                }}
                className="mt-4 text-rose-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
