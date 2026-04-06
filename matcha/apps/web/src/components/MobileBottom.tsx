"use client";
import { navigationItems } from "@/data/navigationItems";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { performLogout } from "@/lib/logout";




export default function MobileBottom() {
  const handleLogout = async () => {
    await performLogout();
    window.location.href = '/';
    };


    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-sm border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems
            .filter((item) => item.label !== 'Notification')
            .map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              size="sm"
              className={`h-auto flex-col py-2 px-1 ${
                item.active ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600' : ''
              }`}
              asChild
            >
              <Link href={item.href} className="flex flex-col items-center">
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                </div>
              </Link>
            </Button>
          ))}
          
          {/* Mobile Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto flex-col py-2 px-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
}