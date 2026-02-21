"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Record", href: "/record" },
  { label: "Text", href: "/text" },
  { label: "Customer Care", href: "/customer-care" },
  { label: "Interview", href: "/interview" },
  { label: "Presentation", href: "/presentation" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            AccentCoach
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-slate-600 transition hover:text-brand",
                  pathname === link.href && "text-brand"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button asChild className="hidden md:inline-flex">
            <Link href="/record">Start coaching</Link>
          </Button>
        </div>
      </motion.header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 md:px-6">{children}</main>
      <footer className="border-t border-slate-100 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Accents aren&apos;t wrong. This is optional clarity coaching.</p>
          <p>Local processing · No paid APIs · Built for privacy</p>
        </div>
      </footer>
    </div>
  );
}
