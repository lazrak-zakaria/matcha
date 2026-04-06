"use client";
import { Bell, Heart, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useRealtimeStore } from "@/store/useRealtimeStore";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { performLogout } from "@/lib/logout";



export default function MobileHeader() {
    const {user} = useAuthStore();
    const unreadCount = useRealtimeStore((state) => state.unreadCount);
    const setNotificationDrawerOpen = useRealtimeStore((state) => state.setNotificationDrawerOpen);
    const handleNotificationClick = () => {
        setNotificationDrawerOpen(true);
    };

    const handleLogout = async () => {
        await performLogout();
        window.location.href = '/';
    };

    return (
        <div className="lg:hidden fixed top-0 left-0 mb-20 right-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">Matcha</h1>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        aria-label="Log out"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNotificationClick}
                    >
                        <div className="relative">
                            <Bell className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-2 -right-1 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500">
                                    {unreadCount}
                                </Badge>
                            )}
                        </div>
                    </Button>
                    <Link href="/profile" aria-label="Go to profile">
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </div>
    );
}