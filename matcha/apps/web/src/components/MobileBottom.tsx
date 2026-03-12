import { navigationItems } from "@/data/navigationItems";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LogOut } from "lucide-react";
import Link from "next/link";




export default function MobileBottom() {
    const unreadCount = 3; // Example unread count for notifications

    const handleLogout = () => {
        // Implement logout logic here
        console.log("Logging out...");
    };

    const handleNotificationClick = () => {
        // Implement notification click logic here
        console.log("Navigating to notifications...");
    };


    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-sm border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              size="sm"
              className={`h-auto flex-col py-2 px-1 ${
                item.active ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600' : ''
              }`}
              onClick={item.label === 'Notification' ? handleNotificationClick : undefined}
              asChild={item.label !== 'Notification'}
            >
              {item.label === 'Notification' ? (
                <div className="flex flex-col items-center cursor-pointer">
                  <div className="relative mb-1">
                    <item.icon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-1 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs truncate">{item.label}</span>
                </div>
              ) : (
                <Link href={item.href} className="flex flex-col items-center">
                  <div className="relative mb-1">
                    <item.icon className="h-5 w-5" />
                    {item.badge && (
                      <Badge className="absolute -top-2 -right-1 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs truncate">{item.label}</span>
                </Link>
              )}
            </Button>
          ))}
          
          {/* Mobile Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto flex-col py-2 px-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mb-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>
    );
}