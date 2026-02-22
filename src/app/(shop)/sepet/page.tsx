"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PaintBucket, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";

export default function SepetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;
  const [mounted, setMounted] = useState(false);
  const {
    guestItems,
    memberItems,
    isLoading,
    fetchMemberCart,
    removeGuestItem,
    removeMemberItem,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMemberCart();
    }
  }, [isAuthenticated, fetchMemberCart]);

  const cartItems = isAuthenticated ? memberItems : guestItems;

  const handleRemove = (id: string) => {
    if (isAuthenticated) {
      removeMemberItem(id);
    } else {
      removeGuestItem(id);
    }
  };

  const handleEdit = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    useCanvasStore.getState().loadCartItemForEditing(item);
    router.push("/tasarim");
  };

  const handleCheckout = () => {
    router.push("/odeme");
  };

  // Wait for client mount
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0 && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <h1 className="text-xl font-semibold mb-2 text-foreground">
            Sepetiniz boş
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Tasarım alanında görsellerinizi yükleyip gang sheet oluşturun,
            ardından sepete ekleyin.
          </p>
          <button
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-primary/20 dark:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
            onClick={() => router.push("/tasarim")}
          >
            <PaintBucket className="h-4 w-4" />
            Tasarım Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted mb-6"
        >
          <Link href="/tasarim">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tasarıma Dön
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase mb-2">
          Sepetim
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {cartItems.length} tasarım sepetinizde
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onEdit={handleEdit}
                isRemoving={isLoading}
              />
            ))}
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              <CartSummary items={cartItems} onCheckout={handleCheckout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
