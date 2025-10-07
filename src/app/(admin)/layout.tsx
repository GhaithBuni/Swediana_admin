"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!authStorage.isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    authStorage.removeToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
