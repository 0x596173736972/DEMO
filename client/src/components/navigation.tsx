import { Button } from "@/components/ui/button";
import { Bell, Menu, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Navigation() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl">ANKHARA</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.type === "premium" && (
              <span className="badge-premium">Premium</span>
            )}
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>
            
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
