import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/images/jra-logo-transparent.png"
      alt="James Roman Advisory"
      width={739}
      height={305}
      priority={priority}
      className={cn("h-10 w-auto object-contain", className)}
      sizes="160px"
    />
  );
}
