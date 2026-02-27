"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  Users,
  Banknote,
  MessageSquare,
  Mail,
  Settings,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  requireSms?: boolean;
  requireEmail?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/siparisler", label: "Siparişler", icon: Package },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/fiyatlandirma", label: "Fiyatlandırma", icon: Banknote },
  { href: "/admin/sms", label: "SMS Yönetimi", icon: MessageSquare, requireSms: true },
  { href: "/admin/email", label: "E-posta", icon: Mail, requireEmail: true },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
];

function SidebarContent({ pathname, smsEnabled, emailEnabled }: { pathname: string; smsEnabled: boolean; emailEnabled: boolean }) {
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const visibleItems = navItems.filter((item) => {
    if (item.requireSms && !smsEnabled) return false;
    if (item.requireEmail && !emailEnabled) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 border-b">
        <Link href="/admin" className="text-lg font-bold text-primary">
          DTF Admin
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Siteye Dön
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings) {
          setSmsEnabled(data.settings.smsEnabled);
          setEmailEnabled(data.settings.emailEnabled);
        }
      })
      .catch(() => { console.error("Admin ayarları yüklenemedi"); });
  }, [pathname]);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-background">
        <SidebarContent pathname={pathname} smsEnabled={smsEnabled} emailEnabled={emailEnabled} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 border-b px-4 h-14">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SidebarContent pathname={pathname} smsEnabled={smsEnabled} emailEnabled={emailEnabled} />
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold text-primary">DTF Admin</span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
