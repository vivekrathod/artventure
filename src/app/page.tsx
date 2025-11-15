import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import { Sparkles, Heart, Package } from "lucide-react";

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/products?featured=true`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-playfair text-5xl font-bold text-gray-900 md:text-6xl">
              Handcrafted Jewelry,
              <br />
              <span className="text-rose-600">Made with Love</span>
            </h1>
            <p className="mt-6 text-lg text-gray-700">
              Discover unique, artisan-crafted beaded jewelry. Each piece tells
              a story of meticulous craftsmanship and timeless elegance.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/products"
                className="rounded-full bg-rose-600 px-8 py-3 text-white transition-colors hover:bg-rose-700"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="rounded-full border-2 border-gray-900 px-8 py-3 text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block">
          <div className="relative h-full w-full opacity-20">
            <Sparkles className="absolute right-20 top-20 h-12 w-12 text-rose-600" />
            <Sparkles className="absolute bottom-40 right-40 h-8 w-8 text-amber-600" />
            <Sparkles className="absolute right-60 top-60 h-10 w-10 text-rose-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Sparkles className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Handcrafted Quality
              </h3>
              <p className="mt-2 text-gray-600">
                Each piece is carefully handcrafted with premium materials
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Heart className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Made with Love</h3>
              <p className="mt-2 text-gray-600">
                Every design is infused with passion and creativity
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Package className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Fast Shipping
              </h3>
              <p className="mt-2 text-gray-600">
                Secure packaging and quick delivery to your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-playfair text-3xl font-bold text-gray-900">
              Featured Collection
            </h2>
            <p className="mt-2 text-gray-600">
              Discover our handpicked selection of signature pieces
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.slice(0, 6).map((product: any) => {
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
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">
                          {product.name}
                        </h3>
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
                No featured products available at the moment.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-rose-600 hover:underline"
              >
                Browse all products
              </Link>
            </div>
          )}

          {featuredProducts.length > 0 && (
            <div className="mt-12 text-center">
              <Link
                href="/products"
                className="inline-block rounded-full border-2 border-rose-600 px-8 py-3 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-600 to-amber-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-white">
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="mt-4 text-lg text-rose-100">
            Explore our full collection of handcrafted beaded jewelry
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-rose-600 transition-colors hover:bg-gray-100"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
