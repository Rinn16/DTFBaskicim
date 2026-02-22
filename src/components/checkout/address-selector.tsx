"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AddressSelectorProps {
  onSelect: (addressId: string) => void;
  onAddNew: () => void;
  selectedId?: string;
}

export function AddressSelector({ onSelect, onAddNew, selectedId }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses);
          // Auto-select default if none selected
          if (!selectedId && data.addresses.length > 0) {
            const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
            onSelect(defaultAddr?.id || data.addresses[0].id);
          }
        }
      } catch {
        // will show empty
      } finally {
        setIsLoading(false);
      }
    }
    fetchAddresses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-6">
        <MapPin className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Henuz adres eklemediniz</p>
        <Button
          variant="outline"
          onClick={onAddNew}
          className="text-foreground/80 border-border hover:bg-muted"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Adres Ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id;
        return (
          <div
            key={addr.id}
            className={cn(
              "p-4 cursor-pointer transition-all rounded-lg border",
              isSelected
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-foreground/[0.02] hover:border-border"
            )}
            onClick={() => onSelect(addr.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">{addr.title}</span>
                  {addr.isDefault && (
                    <Badge className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20">
                      Varsayilan
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground/80">{addr.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {addr.address}, {addr.district}/{addr.city}
                </p>
                <p className="text-xs text-muted-foreground">{addr.phone}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      <Button
        variant="outline"
        className="w-full text-foreground/80 border-border hover:bg-muted"
        onClick={onAddNew}
      >
        <Plus className="h-4 w-4 mr-2" />
        Yeni Adres Ekle
      </Button>
    </div>
  );
}
