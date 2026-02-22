"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/hesabim", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/hesabim/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/ayarlar", label: "Ayarlar", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Neon blobs — dark only */}
        <div className="hidden dark:block">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-accent-brand/5 rounded-full blur-[80px] animate-float" />
        </div>
        {/* Grid pattern — both modes */}
        <div className="absolute inset-0 bg-[linear-gradient(oklch(0_0_0/0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0_0_0/0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
            <div className="sticky top-28 space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Hesabım</h1>

                {/* Mobile: horizontal tabs */}
                <div className="flex gap-1 overflow-x-auto pb-4 lg:hidden">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                        isActive(item.href, item.exact)
                          ? "bg-primary/10 text-primary dark:text-accent-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Desktop: vertical nav */}
                <nav className="hidden lg:flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                        isActive(item.href, item.exact)
                          ? "active"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] group-hover:text-primary dark:group-hover:text-accent-brand transition-colors" />
                      {item.label}
                    </Link>
                  ))}

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group mt-8 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                    Çıkış Yap
                  </button>
                </nav>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="col-span-12 lg:col-span-9 xl:col-span-10 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
