"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, UserPlus, LogIn, LogOut, Package, Settings } from "lucide-react";

export function HomeAuthButtons() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveSession = mounted ? session : null;

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  if (effectiveSession) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full hover:bg-muted"
          >
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {getInitials(effectiveSession.user?.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-popover border-border text-popover-foreground"
        >
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
          <DropdownMenuItem
            asChild
            className="text-foreground/80 focus:bg-muted focus:text-foreground"
          >
            <Link href="/hesabim" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Hesabım
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-foreground/80 focus:bg-muted focus:text-foreground"
          >
            <Link
              href="/hesabim/siparislerim"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Siparişlerim
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-foreground/80 focus:bg-muted focus:text-foreground"
          >
            <Link href="/hesabim/ayarlar" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Ayarlar
            </Link>
          </DropdownMenuItem>
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
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-2">
        <Link href="/giris">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Giriş Yap
          </Button>
        </Link>
        <Link href="/kayit">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            Kayıt Ol
          </Button>
        </Link>
      </div>

      {/* Mobile */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild className="md:hidden">
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full hover:bg-muted"
          >
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-popover border-border text-popover-foreground"
        >
          <DropdownMenuItem
            asChild
            className="text-foreground/80 focus:bg-muted focus:text-foreground"
          >
            <Link href="/giris" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Giriş Yap
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-primary focus:bg-muted focus:text-primary"
          >
            <Link href="/kayit" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Kayıt Ol
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
