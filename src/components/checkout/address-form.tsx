"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addressSchema } from "@/validations/address";
import { guestInfoSchema } from "@/validations/checkout";

const guestAddressSchema = addressSchema.omit({ title: true }).merge(guestInfoSchema);
type GuestAddressData = ReturnType<typeof guestAddressSchema.parse>;
type MemberAddressData = ReturnType<typeof addressSchema.parse>;

interface AddressFormProps {
  isGuest: boolean;
  onSubmit: (data: GuestAddressData | MemberAddressData) => void;
  isSubmitting?: boolean;
}

export function AddressForm({ isGuest, onSubmit, isSubmitting }: AddressFormProps) {
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
              <Label htmlFor="guestName">Ad Soyad *</Label>
              <Input id="guestName" {...register("guestName")} placeholder="Ad Soyad" />
              {err.guestName && (
                <p className="text-xs text-destructive">{err.guestName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestEmail">Email *</Label>
              <Input id="guestEmail" type="email" {...register("guestEmail")} placeholder="email@ornek.com" />
              {err.guestEmail && (
                <p className="text-xs text-destructive">{err.guestEmail.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guestPhone">Telefon *</Label>
            <Input id="guestPhone" {...register("guestPhone")} placeholder="05XX XXX XX XX" />
            {err.guestPhone && (
              <p className="text-xs text-destructive">{err.guestPhone.message}</p>
            )}
          </div>
        </>
      )}

      {!isGuest && (
        <div className="space-y-1.5">
          <Label htmlFor="title">Adres Basligi *</Label>
          <Input id="title" {...register("title")} placeholder="Ev, Is, vb." />
          {err.title && (
            <p className="text-xs text-destructive">{err.title.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Alici Adi *</Label>
          <Input id="fullName" {...register("fullName")} placeholder="Ad Soyad" />
          {err.fullName && (
            <p className="text-xs text-destructive">{err.fullName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefon *</Label>
          <Input id="phone" {...register("phone")} placeholder="05XX XXX XX XX" />
          {err.phone && (
            <p className="text-xs text-destructive">{err.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">Sehir *</Label>
          <Input id="city" {...register("city")} placeholder="Sehir" />
          {err.city && (
            <p className="text-xs text-destructive">{err.city.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">Ilce *</Label>
          <Input id="district" {...register("district")} placeholder="Ilce" />
          {err.district && (
            <p className="text-xs text-destructive">{err.district.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Adres *</Label>
        <Input id="address" {...register("address")} placeholder="Mahalle, sokak, bina no, daire no..." />
        {err.address && (
          <p className="text-xs text-destructive">{err.address.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zipCode">Posta Kodu</Label>
        <Input id="zipCode" {...register("zipCode")} placeholder="34000" className="w-32" />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Kaydediliyor..." : "Adresi Kaydet"}
      </Button>
    </form>
  );
}
