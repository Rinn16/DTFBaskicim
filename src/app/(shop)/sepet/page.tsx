"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PaintBucket, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";

export default function SepetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user?.id;
  const {
    guestItems,
    memberItems,
    isLoading,
    fetchMemberCart,
    removeGuestItem,
    removeMemberItem,
  } = useCartStore();

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

  const handleCheckout = () => {
    router.push("/odeme");
  };

  // Loading state for auth check
  if (status === "loading") {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12">
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
      <div className="container max-w-5xl mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Sepetiniz bos</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Tasarim alaninda gorsellerinizi yukleyip gang sheet olusturun, ardindan sepete ekleyin.
          </p>
          <Button asChild>
            <Link href="/tasarim">
              <PaintBucket className="h-4 w-4 mr-2" />
              Tasarim Olustur
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="h-8">
          <Link href="/tasarim">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tasarima Don
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        Sepetim
        <span className="text-muted-foreground font-normal text-base ml-2">
          ({cartItems.length} tasarim)
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              isRemoving={isLoading}
            />
          ))}
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CartSummary
              items={cartItems}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
