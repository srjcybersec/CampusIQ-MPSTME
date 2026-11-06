import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type CampusIQBrandProps = {
  variant?: "nav" | "auth";
  className?: string;
};

/**
 * Logo PNG has transparent padding on the right — crop visually and pull text close.
 */
export function CampusIQBrand({ variant = "nav", className }: CampusIQBrandProps) {
  const isAuth = variant === "auth";

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden flex items-center justify-center",
          isAuth
            ? "h-24 w-[5.25rem] sm:h-28 sm:w-[6rem]"
            : "h-[4.5rem] w-[3.85rem] sm:h-20 sm:w-[4.25rem] md:h-[5.25rem] md:w-[4.5rem]"
        )}
      >
        <Image
          src="/campusiq-logo.png"
          alt="CampusIQ Logo"
          width={112}
          height={112}
          className={cn(
            "object-contain max-w-none",
            isAuth
              ? "h-24 w-24 sm:h-28 sm:w-28 scale-[1.28]"
              : "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 md:h-[5.25rem] md:w-[5.25rem] scale-[1.32]"
          )}
          priority
        />
      </div>

      <div className="flex flex-col justify-center items-start">
        <span
          className={cn(
            "font-bold tracking-tight whitespace-nowrap leading-tight",
            isAuth ? "text-2xl sm:text-3xl text-white" : "text-2xl sm:text-2xl md:text-xl lg:text-xl gradient-text-purple"
          )}
        >
          CampusIQ
        </span>
        <span
          className={cn(
            "text-[#D4D4D8] -mt-0.5 sm:-mt-1 font-medium whitespace-nowrap leading-tight",
            isAuth ? "text-xs sm:text-sm" : "text-sm sm:text-sm md:text-xs lg:text-xs"
          )}
        >
          MPSTME
        </span>
      </div>
    </div>
  );
}
