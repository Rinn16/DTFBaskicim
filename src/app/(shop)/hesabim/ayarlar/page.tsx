"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

// ---- Schemas ----
const profileSchema = z.object({
  name: z.string().min(1, "Ad zorunlu"),
  surname: z.string().min(1, "Soyad zorunlu"),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı zorunlu"),
  fullName: z.string().min(2, "Ad soyad zorunlu"),
  phone: z.string().min(10, "Geçerli telefon numarası girin"),
  city: z.string().min(1, "Şehir zorunlu"),
  district: z.string().min(1, "İlçe zorunlu"),
  address: z.string().min(10, "Adres en az 10 karakter olmalı"),
  zipCode: z.string().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  taxNumber: string | null;
}

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  zipCode: string | null;
  isDefault: boolean;
}

const inputClass =
  "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:border-primary/50 focus:ring-0 focus:bg-input/80 transition-all outline-none input-glow placeholder:text-muted-foreground text-sm";
const labelClass =
  "text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address dialog state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          profileForm.reset({
            name: data.user.name,
            surname: data.user.surname,
            companyName: data.user.companyName || "",
            taxNumber: data.user.taxNumber || "",
          });
        }
      } catch {
        // silent
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Save profile
  const handleSaveProfile = async (data: ProfileForm) => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setProfile(result.user);
        toast.success("Profil güncellendi");
      } else {
        const result = await res.json();
        toast.error(result.error || "Profil güncellenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open address dialog
  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      addressForm.reset({
        title: address.title,
        fullName: address.fullName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        address: address.address,
        zipCode: address.zipCode || "",
      });
    } else {
      setEditingAddress(null);
      addressForm.reset({
        title: "",
        fullName: "",
        phone: "",
        city: "",
        district: "",
        address: "",
        zipCode: "",
      });
    }
    setAddressDialogOpen(true);
  };

  // Save address
  const handleSaveAddress = async (data: AddressForm) => {
    setIsSavingAddress(true);
    try {
      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editingAddress ? "Adres güncellendi" : "Adres eklendi");
        setAddressDialogOpen(false);
        fetchAddresses();
      } else {
        const result = await res.json();
        toast.error(result.error || "Adres kaydedilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async () => {
    if (!deleteAddressId) return;
    try {
      const res = await fetch(`/api/addresses/${deleteAddressId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Adres silindi");
        setDeleteAddressId(null);
        setAddresses((prev) => prev.filter((a) => a.id !== deleteAddressId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Adres silinemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  // Set default address
  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Varsayılan adres güncellendi");
        fetchAddresses();
      } else {
        toast.error("Varsayılan adres ayarlanamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Section */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden group">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xl font-bold text-foreground">Profil Bilgileri</h2>
        </div>

        {isLoadingProfile ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={profileForm.handleSubmit(handleSaveProfile)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
          >
            <div className="space-y-2">
              <label className={labelClass}>Ad</label>
              <input
                className={inputClass}
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-400">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Soyad</label>
              <input
                className={inputClass}
                {...profileForm.register("surname")}
              />
              {profileForm.formState.errors.surname && (
                <p className="text-xs text-red-400">
                  {profileForm.formState.errors.surname.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Email</label>
              <input
                className={`${inputClass} opacity-50 cursor-not-allowed`}
                value={profile?.email || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Telefon</label>
              <input
                className={`${inputClass} opacity-50 cursor-not-allowed`}
                value={profile?.phone || ""}
                disabled
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Firma Adı</label>
              <input
                className={inputClass}
                {...profileForm.register("companyName")}
                placeholder="Opsiyonel"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Vergi No</label>
              <input
                className={inputClass}
                {...profileForm.register("taxNumber")}
                placeholder="Opsiyonel"
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-sm transition-all shadow-primary/20 dark:shadow-[0_0_20px_rgba(19,127,236,0.3)] hover:shadow-primary/30 dark:hover:shadow-[0_0_30px_rgba(19,127,236,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingProfile && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Kaydet
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Addresses Section */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-foreground">Adreslerim</h2>
          <button
            onClick={() => openAddressDialog()}
            className="flex items-center gap-2 px-4 py-2 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-all text-sm font-medium group"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Yeni Adres
          </button>
        </div>

        {isLoadingAddresses ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Henüz adresiniz yok.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="group relative bg-input/50 border border-border hover:border-border/80 rounded-xl p-5 transition-all duration-300 hover:bg-input"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-foreground font-bold text-lg">
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <div className="text-foreground/80 font-medium">
                      {addr.fullName}
                    </div>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {addr.address}, {addr.district}/{addr.city}
                    </div>
                    <div className="text-muted-foreground/70 text-sm font-mono mt-1">
                      {addr.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                        title="Varsayılan yap"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openAddressDialog(addr)}
                      className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteAddressId(addr.id)}
                      className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Dialog */}
      <Dialog
        open={addressDialogOpen}
        onOpenChange={(open) => !open && setAddressDialogOpen(false)}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addressForm.handleSubmit(handleSaveAddress)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className={labelClass}>Adres Başlığı</Label>
              <Input
                {...addressForm.register("title")}
                placeholder="Ev, İş, vb."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              {addressForm.formState.errors.title && (
                <p className="text-xs text-red-400">
                  {addressForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className={labelClass}>Ad Soyad</Label>
                <Input
                  {...addressForm.register("fullName")}
                  className="bg-input border-border text-foreground"
                />
                {addressForm.formState.errors.fullName && (
                  <p className="text-xs text-red-400">
                    {addressForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Telefon</Label>
                <Input
                  {...addressForm.register("phone")}
                  className="bg-input border-border text-foreground"
                />
                {addressForm.formState.errors.phone && (
                  <p className="text-xs text-red-400">
                    {addressForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className={labelClass}>Şehir</Label>
                <Input
                  {...addressForm.register("city")}
                  className="bg-input border-border text-foreground"
                />
                {addressForm.formState.errors.city && (
                  <p className="text-xs text-red-400">
                    {addressForm.formState.errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>İlçe</Label>
                <Input
                  {...addressForm.register("district")}
                  className="bg-input border-border text-foreground"
                />
                {addressForm.formState.errors.district && (
                  <p className="text-xs text-red-400">
                    {addressForm.formState.errors.district.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Adres</Label>
              <Input
                {...addressForm.register("address")}
                className="bg-input border-border text-foreground"
              />
              {addressForm.formState.errors.address && (
                <p className="text-xs text-red-400">
                  {addressForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Posta Kodu (Opsiyonel)</Label>
              <Input
                {...addressForm.register("zipCode")}
                className="bg-input border-border text-foreground"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddressDialogOpen(false)}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSavingAddress}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 dark:shadow-[0_0_15px_rgba(19,127,236,0.3)]"
              >
                {isSavingAddress && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingAddress ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Address Confirm */}
      <Dialog
        open={!!deleteAddressId}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
      >
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adresi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu adres kalıcı olarak silinecek. Devam etmek istiyor musunuz?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAddressId(null)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAddress}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
