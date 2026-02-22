import Link from "next/link";

function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50 dark:bg-black/40 py-12 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-6 text-primary">
              <LogoSvg className="w-full h-full" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              DTF Baskıcım
            </span>
          </Link>
          <div className="flex gap-8">
            <a
              href="https://instagram.com/dtfbaskicim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Instagram
            </a>
            <a
              href="https://twitter.com/dtfbaskicim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com/company/dtfbaskicim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/70 border-t border-border pt-8">
          <p>
            &copy; {new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="hover:text-muted-foreground transition-colors"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="#"
              className="hover:text-muted-foreground transition-colors"
            >
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
