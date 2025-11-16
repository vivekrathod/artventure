"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    materials: "",
    dimensions: "",
    care_instructions: "",
    inventory_count: "0",
    category_id: "",
    weight_oz: "",
    is_published: false,
    featured: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          inventory_count: parseInt(formData.inventory_count),
          weight_oz: formData.weight_oz ? parseFloat(formData.weight_oz) : null,
          category_id: formData.category_id || null,
        }),
      });

      if (res.ok) {
        toast.success("Product created successfully");
        router.push("/admin/products");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/admin/products"
              className="text-rose-600 hover:underline"
            >
              ← Back to Products
            </Link>
          </div>

          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Add New Product
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-lg bg-white p-6 shadow-md"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Inventory Count *
                  </label>
                  <input
                    type="number"
                    name="inventory_count"
                    value={formData.inventory_count}
                    onChange={handleChange}
                    min="0"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Materials
                </label>
                <input
                  type="text"
                  name="materials"
                  value={formData.materials}
                  onChange={handleChange}
                  placeholder="e.g., Glass beads, Sterling silver"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Dimensions
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 18 inches length"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Care Instructions
                </label>
                <textarea
                  name="care_instructions"
                  value={formData.care_instructions}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-600"
                  />
                  <label
                    htmlFor="is_published"
                    className="ml-2 block text-sm font-medium text-gray-900"
                  >
                    Published (visible to customers)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-600"
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Featured Product
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-rose-600 px-6 py-3 text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
              <Link
                href="/admin/products"
                className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-center text-gray-900 transition-colors hover:border-rose-600 hover:text-rose-600"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
