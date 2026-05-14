import Link from "next/link";
import { Plane } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Plane className="h-5 w-5" />
          <span>{siteConfig.name}</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}