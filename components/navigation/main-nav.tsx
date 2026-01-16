"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  BookOpen,
  Calendar,
  MapPin,
  FolderOpen,
  Users,
  Settings,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/academics", label: "Academics", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/campus", label: "Campus", icon: MapPin },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: "/community", label: "Community", icon: Users },
  { href: "/services", label: "Services", icon: Settings },
  { href: "/extras", label: "Extras", icon: Sparkles },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/50 glass-effect shadow-premium">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Image
                src="/campusiq-logo.png"
                alt="CampusIQ Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold gradient-text">
                CampusIQ
              </span>
              <span className="text-xs text-neutral-500 -mt-1 font-medium">MPSTME</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap relative group flex-shrink-0",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-soft border border-blue-200/50"
                        : "text-neutral-600 hover:text-blue-700 hover:bg-neutral-50/80"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-transform duration-300 flex-shrink-0",
                      isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-12"
                    )} />
                    <span className="hidden md:inline relative">
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
            
            {user && (
              <div className="flex items-center gap-2 pl-4 border-l border-neutral-200/50 flex-shrink-0">
                <div className="hidden lg:flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 px-3 h-9 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <User className="w-4 h-4" />
                  <span className="max-w-[120px] truncate font-medium">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-neutral-600 bg-neutral-50 px-3 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors font-medium whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
