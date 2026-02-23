"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addressSchema } from "@/validations/address";
import { guestInfoSchema } from "@/validations/checkout";

const guestAddressSchema = addressSchema.omit({ title: true, fullName: true, phone: true }).merge(guestInfoSchema);
type GuestAddressData = ReturnType<typeof guestAddressSchema.parse>;
type MemberAddressData = ReturnType<typeof addressSchema.parse>;

interface AddressFormProps {
  isGuest: boolean;
  onSubmit: (data: GuestAddressData | MemberAddressData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const inputClass = "bg-muted border-border text-foreground placeholder:text-muted-foreground";

export function AddressForm({ isGuest, onSubmit, onCancel, isSubmitting }: AddressFormProps) {
  const schema = isGuest ? guestAddressSchema : addressSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // Cast errors to allow conditional field access
  const err = errors as Record<string, { message?: string } | undefined>;

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {isGuest && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="guestName" className="text-foreground/80 text-xs">Ad Soyad *</Label>
              <Input id="guestName" {...register("guestName")} placeholder="Ad Soyad" className={inputClass} />
              {err.guestName && (
                <p className="text-xs text-red-400">{err.guestName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestEmail" className="text-foreground/80 text-xs">Email *</Label>
              <Input id="guestEmail" type="email" {...register("guestEmail")} placeholder="email@ornek.com" className={inputClass} />
              {err.guestEmail && (
                <p className="text-xs text-red-400">{err.guestEmail.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guestPhone" className="text-foreground/80 text-xs">Telefon *</Label>
            <Input id="guestPhone" {...register("guestPhone")} placeholder="05XX XXX XX XX" className={inputClass} />
            {err.guestPhone && (
              <p className="text-xs text-red-400">{err.guestPhone.message}</p>
            )}
          </div>
        </>
      )}

      {!isGuest && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-foreground/80 text-xs">Adres Basligi *</Label>
            <Input id="title" {...register("title")} placeholder="Ev, Is, vb." className={inputClass} />
            {err.title && (
              <p className="text-xs text-red-400">{err.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-foreground/80 text-xs">Alici Adi *</Label>
              <Input id="fullName" {...register("fullName")} placeholder="Ad Soyad" className={inputClass} />
              {err.fullName && (
                <p className="text-xs text-red-400">{err.fullName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-foreground/80 text-xs">Telefon *</Label>
              <Input id="phone" {...register("phone")} placeholder="05XX XXX XX XX" className={inputClass} />
              {err.phone && (
                <p className="text-xs text-red-400">{err.phone.message}</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-foreground/80 text-xs">Sehir *</Label>
          <Input id="city" {...register("city")} placeholder="Sehir" className={inputClass} />
          {err.city && (
            <p className="text-xs text-red-400">{err.city.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-foreground/80 text-xs">Ilce *</Label>
          <Input id="district" {...register("district")} placeholder="Ilce" className={inputClass} />
          {err.district && (
            <p className="text-xs text-red-400">{err.district.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-foreground/80 text-xs">Adres *</Label>
        <Input id="address" {...register("address")} placeholder="Mahalle, sokak, bina no, daire no..." className={inputClass} />
        {err.address && (
          <p className="text-xs text-red-400">{err.address.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zipCode" className="text-foreground/80 text-xs">Posta Kodu</Label>
        <Input id="zipCode" {...register("zipCode")} placeholder="34000" className={`w-32 ${inputClass}`} />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="flex-1 text-foreground/80 hover:text-foreground hover:bg-muted border border-border"
            onClick={onCancel}
          >
            Vazgec
          </Button>
        )}
        <Button
          type="submit"
          className={`${onCancel ? "flex-1" : "w-full"} bg-primary hover:bg-primary/90 text-primary-foreground font-bold`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Kaydediliyor..." : "Adresi Kaydet"}
        </Button>
      </div>
    </form>
  );
}
