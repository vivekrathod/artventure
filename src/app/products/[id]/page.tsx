"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import { useCartStore } from "@/store/cart";
import { ShoppingCart, Sparkles, Heart } from "lucide-react";
import { ProductWithImages } from "@/types/database";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem(product, quantity);
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-playfair text-3xl font-bold text-gray-900">
              Product Not Found
            </h1>
            <p className="mt-2 text-gray-600">
              The product you're looking for doesn't exist.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-block text-rose-600 hover:underline"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = product.product_images || [];
  const currentImage = images[selectedImageIndex] || null;
  const inStock = product.stock_quantity > 0;

  return (
    <MainLayout>
      <div className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Images */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-200">
                {currentImage ? (
                  <Image
                    src={currentImage.image_url}
                    alt={currentImage.alt_text || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Sparkles className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {images.map((image: any, index: number) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-lg bg-gray-200 ${
                        index === selectedImageIndex
                          ? "ring-2 ring-rose-600"
                          : ""
                      }`}
                    >
                      <Image
                        src={image.image_url}
                        alt={image.alt_text || product.name}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="font-playfair text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
              <p className="mt-2 text-3xl font-semibold text-rose-600">
                ${product.price.toFixed(2)}
              </p>

              {inStock ? (
                <p className="mt-2 text-sm text-green-600">In Stock</p>
              ) : (
                <p className="mt-2 text-sm text-red-600">Out of Stock</p>
              )}

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Description
                </h2>
                <p className="mt-2 text-gray-600">{product.description}</p>
              </div>

              {product.materials && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Materials
                  </h2>
                  <p className="mt-2 text-gray-600">{product.materials}</p>
                </div>
              )}

              {product.dimensions && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Dimensions
                  </h2>
                  <p className="mt-2 text-gray-600">{product.dimensions}</p>
                </div>
              )}

              {product.care_instructions && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Care Instructions
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {product.care_instructions}
                  </p>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="mt-8">
                <label className="text-sm font-semibold text-gray-900">
                  Quantity
                </label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center rounded-lg border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                      disabled={!inStock}
                    >
                      -
                    </button>
                    <span className="px-6 py-2 text-gray-900">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(product.stock_quantity, quantity + 1)
                        )
                      }
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                      disabled={!inStock}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-white transition-colors ${
                      inStock
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "cursor-not-allowed bg-gray-400"
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 text-gray-900 transition-colors hover:border-rose-600 hover:text-rose-600">
                  <Heart className="h-5 w-5" />
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
