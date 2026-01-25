"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <motion.nav
      className="sticky top-0 z-50 glass-nav"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18 gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0" data-cursor-hover>
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: 3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C7CFF]/20 to-[#38BDF8]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image
                src="/campusiq-logo.png"
                alt="CampusIQ Logo"
                width={64}
                height={64}
                className="object-contain relative z-10"
                priority
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-bold gradient-text-purple tracking-tight">
                CampusIQ
              </span>
              <span className="text-xs text-[#D4D4D8] -mt-1 font-medium">MPSTME</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 justify-center md:justify-start">
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide flex-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap relative group flex-shrink-0",
                        isActive
                          ? "bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] text-white shadow-lg glow-purple"
                          : "text-[#D4D4D8] hover:text-white hover:bg-[#161616]/50"
                      )}
                      data-cursor-hover
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-all duration-300 flex-shrink-0",
                        isActive ? "scale-110 rotate-0" : "group-hover:scale-110 group-hover:rotate-12"
                      )} />
                      <span className="hidden md:inline relative">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.span
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white/80 rounded-full"
                          layoutId="activeIndicator"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            
            {user && (
              <motion.div
                className="flex items-center gap-3 pl-4 border-l border-[#1a1a1a] flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="hidden lg:flex items-center gap-2.5 text-sm text-[#D4D4D8] glass-card px-4 h-10 rounded-xl">
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <User className="w-4 h-4 text-[#7C7CFF]" />
                  <span className="max-w-[120px] truncate font-semibold text-white">{user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#D4D4D8] hover:text-red-400"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
