"use client";

import { OrderTracker } from "@/components/order/order-tracker";
import { Package } from "lucide-react";

export default function SiparisTakipPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sipariş Takip</h1>
        <p className="text-muted-foreground text-sm">
          Sipariş numaranız ve email adresiniz ile siparişinizin durumunu sorgulayabilirsiniz.
        </p>
      </div>

      <OrderTracker />
    </div>
  );
}
