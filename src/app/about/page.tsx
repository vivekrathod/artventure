import MainLayout from "@/components/layout/MainLayout";
import { Heart, Sparkles, Award, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-playfair text-4xl font-bold text-gray-900 md:text-5xl">
            Our Story
          </h1>
          <p className="mt-6 text-lg text-gray-700">
            Discover the passion and craftsmanship behind every piece of jewelry
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              Welcome to ArtVenture, where every piece of jewelry tells a
              unique story. What started as a passion for creating beautiful,
              handcrafted accessories has blossomed into a journey of artistry
              and dedication to quality craftsmanship.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              Each piece in our collection is meticulously handcrafted with
              premium materials, ensuring that no two items are exactly alike.
              We believe that jewelry should be more than just an accessory—it
              should be a reflection of your unique personality and style.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-gray-700">
              Our commitment to quality extends beyond the materials we use. We
              take pride in the attention to detail that goes into every bead,
              every clasp, and every finishing touch. From concept to
              completion, we pour our hearts into creating pieces that you'll
              treasure for years to come.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-3xl font-bold text-gray-900">
            What We Stand For
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Heart className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Made with Love
              </h3>
              <p className="mt-2 text-gray-600">
                Every piece is crafted with passion and care
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Sparkles className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Premium Materials
              </h3>
              <p className="mt-2 text-gray-600">
                We use only the finest beads and materials
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Award className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Quality Craftsmanship
              </h3>
              <p className="mt-2 text-gray-600">
                Meticulous attention to detail in every piece
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Users className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Customer First
              </h3>
              <p className="mt-2 text-gray-600">
                Your satisfaction is our top priority
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-playfair text-3xl font-bold text-gray-900">
            Our Crafting Process
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white">
                1
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Design & Inspiration
              </h3>
              <p className="mt-2 text-gray-600">
                Each piece begins with a unique design concept, inspired by
                nature, art, and personal stories.
              </p>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white">
                2
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Material Selection
              </h3>
              <p className="mt-2 text-gray-600">
                We carefully select premium beads, stones, and materials that
                meet our high standards of quality.
              </p>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white">
                3
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Handcrafted Creation
              </h3>
              <p className="mt-2 text-gray-600">
                Every piece is meticulously assembled by hand, ensuring
                attention to detail and lasting quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-600 to-amber-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-playfair text-3xl font-bold text-white">
            Ready to Discover Your Perfect Piece?
          </h2>
          <p className="mt-4 text-lg text-rose-100">
            Explore our collection of handcrafted jewelry
          </p>
          <a
            href="/products"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-rose-600 transition-colors hover:bg-gray-100"
          >
            Shop Now
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
