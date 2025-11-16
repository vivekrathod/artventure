"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import Link from "next/link";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface UploadedImage {
  url: string;
  fileName: string;
  altText: string;
}

interface ExistingImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);
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

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (res.ok) {
        const product = await res.json();
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          materials: product.materials || "",
          dimensions: product.dimensions || "",
          care_instructions: product.care_instructions || "",
          inventory_count: product.inventory_count?.toString() || "0",
          category_id: product.category_id || "",
          weight_oz: product.weight_oz?.toString() || "",
          is_published: product.is_published || false,
          featured: product.featured || false,
        });
        setExistingImages(product.product_images || []);
      } else {
        toast.error("Failed to load product");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setNewImages((prev) => [
          ...prev,
          { url: data.url, fileName: data.fileName, altText: "" },
        ]);
        toast.success("Image uploaded successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = ""; // Reset input
    }
  };

  const removeExistingImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/admin/products/images/${imageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image deleted successfully");
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const updateNewImageAltText = (index: number, altText: string) => {
    setNewImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, altText } : img))
    );
  };

  const updateExistingImageAltText = async (
    imageId: string,
    altText: string
  ) => {
    setExistingImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, alt_text: altText } : img
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update product
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          inventory_count: parseInt(formData.inventory_count),
          weight_oz: formData.weight_oz ? parseFloat(formData.weight_oz) : null,
          category_id: formData.category_id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update product");
        return;
      }

      // Update alt text for existing images
      for (const img of existingImages) {
        if (img.alt_text !== null) {
          await fetch(`/api/admin/products/images/${img.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alt_text: img.alt_text,
            }),
          });
        }
      }

      // Add new images
      if (newImages.length > 0) {
        const currentMaxOrder = existingImages.length > 0
          ? Math.max(...existingImages.map((img) => img.display_order))
          : -1;

        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          await fetch(`/api/admin/products/${productId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: img.url,
              alt_text: img.altText || formData.name,
              display_order: currentMaxOrder + i + 1,
            }),
          });
        }
      }

      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

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
            Edit Product
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

              {/* Image Management Section */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Product Images
                </label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Current Images
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative rounded-lg border border-gray-200 p-4"
                        >
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {/* Image Preview */}
                          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={img.image_url}
                              alt={img.alt_text || "Product image"}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Alt Text Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700">
                              Alt Text (for accessibility)
                            </label>
                            <input
                              type="text"
                              value={img.alt_text || ""}
                              onChange={(e) =>
                                updateExistingImageAltText(img.id, e.target.value)
                              }
                              placeholder="Describe the image..."
                              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                            />
                          </div>

                          {/* Display Order Badge */}
                          <div className="mt-2 text-xs text-gray-500">
                            Display order: {img.display_order + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div className="mb-4">
                  <label
                    htmlFor="image-upload"
                    className={`inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:border-rose-600 hover:text-rose-600 ${
                      uploadingImage ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-600 border-t-transparent"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Upload New Image</span>
                      </>
                    )}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Accepted formats: JPEG, PNG, WebP. Max size: 5MB
                  </p>
                </div>

                {/* New Images Preview */}
                {newImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      New Images (will be added on save)
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {newImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative rounded-lg border border-green-200 bg-green-50 p-4"
                        >
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {/* Image Preview */}
                          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={img.url}
                              alt={img.altText || `New product image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Alt Text Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700">
                              Alt Text (for accessibility)
                            </label>
                            <input
                              type="text"
                              value={img.altText}
                              onChange={(e) =>
                                updateNewImageAltText(index, e.target.value)
                              }
                              placeholder="Describe the image..."
                              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingImages.length === 0 && newImages.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No images uploaded yet
                    </p>
                  </div>
                )}
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
                disabled={saving}
                className="flex-1 rounded-lg bg-rose-600 px-6 py-3 text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save Changes"}
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
