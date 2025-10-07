// app/(dashboard)/admin/layout.tsx (or wherever your AdminLayout lives)
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStorage } from "@/app/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Översikt" },
  { href: "/service/flyttstad", label: "Flyttstäd" },
  { href: "/admin/moving", label: "Flytt" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authStorage.isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    authStorage.removeToken();
    router.push("/login");
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Brand */}
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              {/* Swap /logo.svg to your asset */}
              <Image
                src="/logo.svg"
                width={28}
                height={28}
                alt="Logo"
                className="rounded"
                priority
              />
              <span className="text-base font-semibold tracking-tight">
                Admin Dashboard
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  size="sm"
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="rounded-xl"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>

            {/* Right actions (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logga ut
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Image
                        src="/logo.svg"
                        width={24}
                        height={24}
                        alt="Logo"
                        className="rounded"
                      />
                      Admin Dashboard
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-4 space-y-1">
                    {NAV.map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          // close sheet via navigation
                          router.push(item.href);
                        }}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <SheetFooter className="mt-auto">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logga ut
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
