import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import MainLayout from "@/components/layout/MainLayout";
import { User, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            My Account
          </h1>

          <div className="mt-8 space-y-6">
            {/* Profile Information */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                    <User className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                    <Mail className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">
                      {user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                    <Calendar className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Link
                href="/account/orders"
                className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <h3 className="font-semibold text-gray-900">Order History</h3>
                <p className="mt-2 text-sm text-gray-600">
                  View your past orders and track current shipments
                </p>
              </Link>

              <Link
                href="/wishlist"
                className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <h3 className="font-semibold text-gray-900">Wishlist</h3>
                <p className="mt-2 text-sm text-gray-600">
                  View and manage your saved items
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
