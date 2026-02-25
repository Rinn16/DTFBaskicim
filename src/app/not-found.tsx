import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-8xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Sayfa Bulunamadı
      </h1>
      <p className="mt-2 text-muted-foreground">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
