import { Link, useLocation } from "wouter";
import { Home, Shirt, Zap, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { href: "/generate", icon: Zap, label: "Generate", accent: true },
  { href: "/recommendations", icon: Heart, label: "Outfits" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label, accent }) => {
            const isActive = location === href;
            
            return (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "nav-item",
                    isActive && "active",
                    accent && !isActive && "text-gray-500"
                  )}
                >
                  {accent ? (
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    accent && !isActive && "text-accent"
                  )}>
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
