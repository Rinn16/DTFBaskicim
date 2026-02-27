"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerRow {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  orderCount: number;
  totalSpent: number;
  specialPrice: number | null;
  createdAt: string;
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      if (currentSearch) params.set("search", currentSearch);

      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error("Müşteri listesi yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (updates.search !== undefined) params.set("page", "1");
    router.push(`/admin/musteriler?${params}`);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Müşteriler</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} müşteri</span>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/admin/export?type=customers" download>
              <Download className="h-4 w-4 mr-1.5" />
              CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2 max-w-md">
          <Input
            placeholder="Ad, email, telefon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9"
          />
          <Button size="sm" variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead className="text-right">Sipariş</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead>Özel Fiyat</TableHead>
                <TableHead>Kayıt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/musteriler/${c.id}`)}
                >
                  <TableCell>
                    <p className="font-medium text-sm">
                      {c.name} {c.surname}
                    </p>
                    {c.companyName && (
                      <p className="text-xs text-muted-foreground">
                        {c.companyName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{c.email || "—"}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.orderCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">
                    {c.totalSpent.toFixed(2)} TL
                  </TableCell>
                  <TableCell>
                    {c.specialPrice && (
                      <Badge variant="secondary" className="text-[10px]">
                        {c.specialPrice} TL/m
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">Müşteri bulunamadı</p>
                      {currentSearch && (
                        <p className="text-xs">Farklı bir arama terimi deneyin</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Sayfa {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateParams({ page: (currentPage - 1).toString() })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateParams({ page: (currentPage + 1).toString() })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
