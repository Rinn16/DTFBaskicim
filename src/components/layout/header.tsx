"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, User, UserPlus, LogIn, LogOut, Package, Palette, Settings, FileUp } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useCartStore } from "@/stores/cart-store";
import { useEffect, useState } from "react";

function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveSession = mounted ? session : null;
  const isAuthenticated = !!effectiveSession?.user?.id;
  const { getCartCount, fetchMemberCart, _hasHydrated } = useCartStore();
  const cartCount = mounted && _hasHydrated ? getCartCount(isAuthenticated) : 0;

  useEffect(() => {
    if (isAuthenticated) {
      fetchMemberCart();
    }
  }, [isAuthenticated, fetchMemberCart]);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3">
      <div className="max-w-[1400px] mx-auto rounded-2xl bg-background/80 backdrop-blur-xl border border-border px-5 h-14 flex items-center justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 text-primary drop-shadow-[0_0_8px_oklch(0.55_0.2_255_/_0.3)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
            <LogoSvg className="w-full h-full" />
          </div>
          <h2 className="text-foreground text-base font-bold tracking-tight">
            DTF<span className="text-primary">Baskıcım</span>
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/tasarim"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
          >
            <FileUp className="h-4 w-4" />
            Tasarım Oluştur
          </Link>
          <Link
            href="/sepet"
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            Sepet
            {cartCount > 0 && (
              <span className="absolute top-0.5 left-[52px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {effectiveSession ? (
            <>
              {/* Mobile cart */}
              <Link href="/sepet" className="relative md:hidden">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full hover:bg-muted"
                  >
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {getInitials(effectiveSession.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground">
                        {effectiveSession.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {effectiveSession.user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="text-foreground/80 focus:bg-muted focus:text-foreground">
                    <Link href="/hesabim" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Hesabım
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-foreground/80 focus:bg-muted focus:text-foreground">
                    <Link
                      href="/hesabim/siparislerim"
                      className="flex items-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      Siparişlerim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-foreground/80 focus:bg-muted focus:text-foreground">
                    <Link
                      href="/hesabim/ayarlar"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Ayarlar
                    </Link>
                  </DropdownMenuItem>
                  {effectiveSession.user?.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem asChild className="text-primary focus:bg-muted focus:text-primary">
                        <Link
                          href="/admin"
                          className="flex items-center gap-2"
                        >
                          Admin Paneli
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 text-red-500 dark:text-red-400 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Desktop: text buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Link href="/giris">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    Kayıt Ol
                  </Button>
                </Link>
              </div>

              {/* Mobile: user icon with dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full hover:bg-muted"
                  >
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border-border text-popover-foreground">
                  <DropdownMenuItem asChild className="text-foreground/80 focus:bg-muted focus:text-foreground">
                    <Link href="/giris" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Giriş Yap
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-primary focus:bg-muted focus:text-primary">
                    <Link href="/kayit" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Kayıt Ol
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-popover border-border text-popover-foreground">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/tasarim"
                  className="flex items-center gap-3 text-sm font-medium py-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  Tasarım Oluştur
                </Link>
                <Link
                  href="/sepet"
                  className="flex items-center gap-3 text-sm font-medium py-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  Sepet
                  {cartCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {!effectiveSession && (
                  <>
                    <hr className="border-border" />
                    <Link href="/giris">
                      <Button variant="ghost" className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-muted">
                        Giriş Yap
                      </Button>
                    </Link>
                    <Link href="/kayit">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                        Kayıt Ol
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
