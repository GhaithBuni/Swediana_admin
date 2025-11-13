// app/(dashboard)/admin/layout.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStorage } from "@/app/lib/auth";
import { Toaster, ToastT } from "sonner";

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
import { Menu, LogOut, ChevronDown } from "lucide-react";

// shadcn navigation menu (desktop)
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

// shadcn accordion (mobile groups)
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const TOP_NAV = [
  { href: "/dashboard", label: "Översikt" },
  { href: "/register", label: "Registrera" },
  { href: "/discount", label: "Rabatter" },
];

const SERVICE_LINKS = [
  { href: "/service/flyttstad", label: "Flyttstäd" },
  { href: "/service/flytthjalp", label: "Flytt" },
  { href: "/service/byggstad", label: "Byggstäd" },
  { href: "/service/contact", label: "Kontaktformulär" },
];

const CALENDAR_LINKS = [
  { href: "/calendar/flyttstad", label: "Kalender • Städ" },
  { href: "/calendar/flytthjalp", label: "Kalender • Flytt" },
];

const PRICES_LINKS = [
  { href: "/prices/stad", label: "Priser • Städ" },
  { href: "/prices/flytt", label: "Priser • Flytt" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <Link
              href="/dashboard"
              className="flex items-center gap-2 shrink-0"
            >
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
              {/* top-level simple links */}
              {TOP_NAV.map((item) => (
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

              {/* Services menu */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="rounded-xl">
                      Tjänster
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-2">
                      <div className="grid min-w-[260px] gap-1 p-1">
                        {SERVICE_LINKS.map((l) => (
                          <NavMenuRow
                            key={l.href}
                            href={l.href}
                            active={isActive(l.href)}
                          >
                            {l.label}
                          </NavMenuRow>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Calendar menu */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="rounded-xl">
                      Kalender
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-2">
                      <div className="grid min-w-[260px] gap-1 p-1">
                        {CALENDAR_LINKS.map((l) => (
                          <NavMenuRow
                            key={l.href}
                            href={l.href}
                            active={isActive(l.href)}
                          >
                            {l.label}
                          </NavMenuRow>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="rounded-xl">
                      Priser
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-2">
                      <div className="grid min-w-[260px] gap-1 p-1">
                        {PRICES_LINKS.map((l) => (
                          <NavMenuRow
                            key={l.href}
                            href={l.href}
                            active={isActive(l.href)}
                          >
                            {l.label}
                          </NavMenuRow>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
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
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
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

                  {/* Simple links */}
                  <div className="mt-4 space-y-1">
                    {TOP_NAV.map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileOpen(false);
                          router.push(item.href);
                        }}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </div>

                  {/* Grouped sections */}
                  <div className="mt-4">
                    <Accordion type="multiple" defaultValue={["services"]}>
                      <AccordionItem value="services" className="border-none">
                        <AccordionTrigger className="px-2 rounded-lg hover:no-underline">
                          <span className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            Tjänster
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 px-2">
                            {SERVICE_LINKS.map((l) => (
                              <Button
                                key={l.href}
                                asChild
                                variant={
                                  isActive(l.href) ? "secondary" : "ghost"
                                }
                                className="w-full justify-start"
                                onClick={() => {
                                  setMobileOpen(false);
                                  router.push(l.href);
                                }}
                              >
                                <Link href={l.href}>{l.label}</Link>
                              </Button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="calendar" className="border-none">
                        <AccordionTrigger className="px-2 rounded-lg hover:no-underline">
                          <span className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            Kalender
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 px-2">
                            {CALENDAR_LINKS.map((l) => (
                              <Button
                                key={l.href}
                                asChild
                                variant={
                                  isActive(l.href) ? "secondary" : "ghost"
                                }
                                className="w-full justify-start"
                                onClick={() => {
                                  setMobileOpen(false);
                                  router.push(l.href);
                                }}
                              >
                                <Link href={l.href}>{l.label}</Link>
                              </Button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}

/* ---------- small helpers ---------- */

function NavMenuRow({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={`rounded-lg px-3 py-2 text-sm hover:bg-accent ${
          active ? "bg-accent" : ""
        }`}
      >
        {children}
      </Link>
    </NavigationMenuLink>
  );
}
