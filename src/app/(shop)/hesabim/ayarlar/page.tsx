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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Star, MonitorSmartphone, LogOut, Lock, Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";

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

interface UserSessionEntry {
  id: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: authSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({ emailOptIn: true, smsOptIn: true });
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<UserSessionEntry[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);
  const [showSignOutAllDialog, setShowSignOutAllDialog] = useState(false);

  // Email change dialog state
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [emailChangeValue, setEmailChangeValue] = useState("");
  const [emailChangeSending, setEmailChangeSending] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState("");

  // Phone change dialog state
  const [phoneChangeOpen, setPhoneChangeOpen] = useState(false);
  const [phoneChangeStep, setPhoneChangeStep] = useState<"phone" | "otp">("phone");
  const [phoneChangeValue, setPhoneChangeValue] = useState("");
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [phoneChangeSending, setPhoneChangeSending] = useState(false);
  const [phoneChangeSuccess, setPhoneChangeSuccess] = useState(false);
  const [phoneChangeError, setPhoneChangeError] = useState("");

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
        toast.error("Profil bilgileri yüklenemedi");
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
      toast.error("Adresler yüklenemedi");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/user/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
          setCurrentSessionId(data.currentSessionId);
        }
      } catch {
        toast.error("Aktif oturumlar yüklenemedi");
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchSessions();
  }, []);

  // Fetch notification prefs
  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/user/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifPrefs({ emailOptIn: data.emailOptIn, smsOptIn: data.smsOptIn });
        }
      } catch {
        toast.error("Bildirim tercihleri yüklenemedi");
      } finally {
        setIsLoadingNotifs(false);
      }
    }
    fetchNotifs();
  }, []);

  const handleToggleNotif = async (key: "emailOptIn" | "smsOptIn", value: boolean) => {
    setNotifPrefs((p) => ({ ...p, [key]: value }));
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        setNotifPrefs((p) => ({ ...p, [key]: !value }));
        toast.error("Tercih güncellenemedi");
      }
    } catch {
      setNotifPrefs((p) => ({ ...p, [key]: !value }));
      toast.error("Bir hata oluştu");
    }
  };

  const handleRequestEmailChange = async () => {
    setEmailChangeError("");
    if (!emailChangeValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailChangeValue)) {
      setEmailChangeError("Geçerli bir email adresi girin");
      return;
    }
    setEmailChangeSending(true);
    try {
      const res = await fetch("/api/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emailChangeValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailChangeSent(true);
      } else {
        setEmailChangeError(data.error || "İstek gönderilemedi");
      }
    } catch {
      setEmailChangeError("Bir hata oluştu");
    } finally {
      setEmailChangeSending(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    setPhoneChangeError("");
    setPhoneChangeSending(true);
    try {
      const res = await fetch("/api/user/change-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPhone: phoneChangeValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneChangeStep("otp");
      } else {
        setPhoneChangeError(data.error || "Kod gönderilemedi");
      }
    } catch {
      setPhoneChangeError("Bir hata oluştu");
    } finally {
      setPhoneChangeSending(false);
    }
  };

  const handleVerifyPhoneChange = async () => {
    setPhoneChangeError("");
    setPhoneChangeSending(true);
    try {
      const res = await fetch("/api/user/change-phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: phoneOtpValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneChangeSuccess(true);
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);
        }
      } else {
        setPhoneChangeError(data.error || "Doğrulama başarısız");
      }
    } catch {
      setPhoneChangeError("Bir hata oluştu");
    } finally {
      setPhoneChangeSending(false);
    }
  };

  const handleSignOutAll = async () => {
    setSignOutAllLoading(true);
    try {
      const res = await fetch("/api/user/sessions", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/giris" });
      } else {
        toast.error("Oturumlar sonlandırılamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSignOutAllLoading(false);
      setShowSignOutAllDialog(false);
    }
  };

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

  const handleChangePassword = async () => {
    setPasswordErrors({});
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = "Mevcut şifre gerekli";
    if (newPassword.length < 8) errs.newPassword = "En az 8 karakter olmalı";
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = "En az bir büyük harf içermeli";
    else if (!/[a-z]/.test(newPassword)) errs.newPassword = "En az bir küçük harf içermeli";
    else if (!/[0-9]/.test(newPassword)) errs.newPassword = "En az bir rakam içermeli";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Şifreler eşleşmedi";
    if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return; }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Şifre başarıyla değiştirildi");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        if (data.details?.fieldErrors) {
          setPasswordErrors(Object.fromEntries(
            Object.entries(data.details.fieldErrors).map(([k, v]) => [k, (v as string[])[0]])
          ));
        } else {
          toast.error(data.error || "Şifre değiştirilemedi");
        }
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSavingPassword(false);
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Hesap silinemedi");
        return;
      }
      toast.success("Hesabınız silindi");
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
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
              <div className="flex gap-2">
                <input
                  className={`${inputClass} opacity-50 cursor-not-allowed flex-1`}
                  value={profile?.email || ""}
                  disabled
                />
                <button
                  type="button"
                  onClick={() => {
                    setEmailChangeValue("");
                    setEmailChangeSent(false);
                    setEmailChangeError("");
                    setEmailChangeOpen(true);
                  }}
                  className="px-3 py-2 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                >
                  Değiştir
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Telefon</label>
              <div className="flex gap-2">
                <input
                  className={`${inputClass} opacity-50 cursor-not-allowed flex-1`}
                  value={profile?.phone || ""}
                  disabled
                  placeholder="+90 5XX XXX XX XX"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoneChangeStep("phone");
                    setPhoneChangeValue("");
                    setPhoneOtpValue("");
                    setPhoneChangeSuccess(false);
                    setPhoneChangeError("");
                    setPhoneChangeOpen(true);
                  }}
                  className="px-3 py-2 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                >
                  Değiştir
                </button>
              </div>
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

      {/* Password Change Section */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">Şifre Değiştir</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>Mevcut Şifre</label>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-400">{passwordErrors.currentPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Yeni Şifre</label>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="En az 8 karakter"
            />
            {passwordErrors.newPassword && (
              <p className="text-xs text-red-400">{passwordErrors.newPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Yeni Şifre Tekrar</label>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-red-400">{passwordErrors.confirmPassword}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleChangePassword}
            disabled={isSavingPassword}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-sm transition-all shadow-primary/20 dark:shadow-[0_0_20px_rgba(19,127,236,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            Şifreyi Değiştir
          </button>
        </div>
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

      {/* Sessions Section */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Aktif Oturumlar</h2>
          </div>
          <button
            onClick={() => setShowSignOutAllDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Tümünden Çıkış
          </button>
        </div>

        {isLoadingSessions ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aktif oturum bulunamadı.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    isCurrent
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-input/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className={`h-4 w-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isCurrent ? "Bu cihaz" : "Diğer cihaz"}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Aktif
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Giriş:{" "}
                        {new Date(s.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sign Out All Confirm */}
      <AlertDialog open={showSignOutAllDialog} onOpenChange={setShowSignOutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tüm cihazlardan çıkış yapılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              Tüm aktif oturumlar sonlandırılacak ve yeniden giriş yapmanız gerekecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signOutAllLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleSignOutAll}
              disabled={signOutAllLoading}
            >
              {signOutAllLoading ? "Çıkış yapılıyor..." : "Evet, Tümünden Çık"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">Bildirim Tercihleri</h2>
        </div>

        {isLoadingNotifs ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">E-posta bildirimleri</p>
                <p className="text-xs text-muted-foreground">Sipariş durumu, kargo bilgisi ve kampanyalar</p>
              </div>
              <Switch
                checked={notifPrefs.emailOptIn}
                onCheckedChange={(v) => handleToggleNotif("emailOptIn", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">SMS bildirimleri</p>
                <p className="text-xs text-muted-foreground">Sipariş durumu ve kargo SMS'leri</p>
              </div>
              <Switch
                checked={notifPrefs.smsOptIn}
                onCheckedChange={(v) => handleToggleNotif("smsOptIn", v)}
              />
            </div>
            <p className="text-xs text-muted-foreground px-1">
              Hesap güvenliği ve ödeme onayı gibi zorunlu bildirimler bu tercihten etkilenmez.
            </p>
          </div>
        )}
      </div>

      {/* Hesap Silme Bölümü */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 md:p-8">
        <h2 className="text-lg font-bold text-destructive mb-2">Tehlikeli Bölge</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Hesabınızı sildiğinizde tüm kişisel verileriniz anonimleştirilir.
          Adresleriniz, taslaklarınız ve sepetiniz kalıcı olarak silinir.
          Tamamlanmış siparişlerin fatura bilgileri yasal zorunluluk gereği saklanır.
          Bu işlem geri alınamaz.
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Hesabımı Sil
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabınızı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Tüm kişisel verileriniz anonimleştirilecek,
              adresleriniz ve taslaklarınız kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Siliniyor..." : "Evet, Hesabımı Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Change Dialog */}
      <Dialog
        open={emailChangeOpen}
        onOpenChange={(open) => { if (!open) setEmailChangeOpen(false); }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">E-posta Adresini Değiştir</DialogTitle>
          </DialogHeader>
          {emailChangeSent ? (
            <div className="py-4 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm text-foreground font-medium">Doğrulama linki gönderildi!</p>
              <p className="text-xs text-muted-foreground">
                <strong>{emailChangeValue}</strong> adresine doğrulama linki gönderdik.
                Linke tıklayarak email adresinizi değiştirebilirsiniz.
              </p>
              <Button onClick={() => setEmailChangeOpen(false)} className="w-full">
                Tamam
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yeni email adresinize bir doğrulama linki göndereceğiz.
              </p>
              <div className="space-y-2">
                <Label className={labelClass}>Yeni E-posta Adresi</Label>
                <Input
                  type="email"
                  value={emailChangeValue}
                  onChange={(e) => setEmailChangeValue(e.target.value)}
                  placeholder="yeni@email.com"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {emailChangeError && (
                  <p className="text-xs text-destructive">{emailChangeError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEmailChangeOpen(false)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  İptal
                </Button>
                <Button onClick={handleRequestEmailChange} disabled={emailChangeSending}>
                  {emailChangeSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Doğrulama Linki Gönder
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Phone Change Dialog */}
      <Dialog
        open={phoneChangeOpen}
        onOpenChange={(open) => { if (!open) setPhoneChangeOpen(false); }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Telefon Numarasını Değiştir</DialogTitle>
          </DialogHeader>
          {phoneChangeSuccess ? (
            <div className="py-4 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm text-foreground font-medium">Telefon numaranız güncellendi!</p>
              <Button onClick={() => setPhoneChangeOpen(false)} className="w-full">
                Tamam
              </Button>
            </div>
          ) : phoneChangeStep === "phone" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yeni telefon numaranıza doğrulama kodu göndereceğiz.
              </p>
              <div className="space-y-2">
                <Label className={labelClass}>Yeni Telefon Numarası</Label>
                <Input
                  type="tel"
                  value={phoneChangeValue}
                  onChange={(e) => setPhoneChangeValue(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {phoneChangeError && (
                  <p className="text-xs text-destructive">{phoneChangeError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPhoneChangeOpen(false)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  İptal
                </Button>
                <Button onClick={handleRequestPhoneChange} disabled={phoneChangeSending}>
                  {phoneChangeSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Kod Gönder
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{phoneChangeValue}</strong> numarasına 6 haneli doğrulama kodu gönderdik.
              </p>
              <div className="space-y-2">
                <Label className={labelClass}>Doğrulama Kodu</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneOtpValue}
                  onChange={(e) => setPhoneOtpValue(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground tracking-widest text-center text-lg"
                />
                {phoneChangeError && (
                  <p className="text-xs text-destructive">{phoneChangeError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPhoneChangeStep("phone")}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Geri
                </Button>
                <Button
                  onClick={handleVerifyPhoneChange}
                  disabled={phoneChangeSending || phoneOtpValue.length !== 6}
                >
                  {phoneChangeSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Doğrula
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
