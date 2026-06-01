"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ButtonLink } from "@/components/button-link";

const navItems = [
  { label: "The Process", href: "#process" },
  { label: "Malibu Story", href: "#story" },
  { label: "Certifications", href: "#certifications" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="motion-fade-up sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="James Roman Advisory home">
          <BrandLogo priority className="h-9 sm:h-10" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/portal" size="sm">
            Private Office
            <ArrowRight data-icon="inline-end" />
          </ButtonLink>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" className="md:hidden" />}>
              <Menu className="transition-transform duration-300 group-aria-expanded/button:rotate-90" />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>James Roman Advisory</SheetTitle>
                <SheetDescription>Private owner-side advisory navigation.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col border-y">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="border-b px-4 py-4 font-heading text-2xl transition-colors hover:bg-muted/40 hover:text-primary last:border-b-0"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
