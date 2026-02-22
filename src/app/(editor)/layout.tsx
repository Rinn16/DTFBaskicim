import Link from "next/link";
import { Home, ShoppingCart } from "lucide-react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex h-screen flex-col bg-[#080b11]">
      {/* Editor Header */}
      <header className="flex items-center justify-between h-12 px-4 border-b border-white/5 bg-[#0a0e17]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-base font-bold tracking-tight text-white neon-glow">
            DTF Baskicim
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80 bg-cyan-400/10 px-1.5 py-0.5 rounded">
            Editor
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Ana Sayfa
          </Link>
          <Link
            href="/sepet"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Sepet
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
