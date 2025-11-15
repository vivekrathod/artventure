import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import { Sparkles } from "lucide-react";

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-playfair text-4xl font-bold text-gray-900">
              Our Collection
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Browse our handcrafted beaded jewelry pieces
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product: any) => {
                const primaryImage = product.product_images?.find(
                  (img: any) => img.is_primary
                ) || product.product_images?.[0];

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
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
                        {product.stock_quantity === 0 && (
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
                No products available at the moment. Please check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
