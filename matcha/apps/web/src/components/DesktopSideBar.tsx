'use client';
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChevronLeft, ChevronRight, Heart, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { navigationItems } from "@/data/navigationItems";
import { useRouter } from "next/dist/client/components/navigation";
import Link from "next/link";



export default function DesktopSideBar({ isSidebarCollapsed, setIsSidebarCollapsed }: { isSidebarCollapsed: boolean, setIsSidebarCollapsed: (value: boolean) => void }) {

    const router = useRouter();

    const unreadCount = 5;

    const handleLogout = () => {

        console.log("Logging out...");
    };

    const handleNotificationClick = () => {
        console.log("Navigating to notifications...");
    };


    return (
        <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 ${isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-72'
            } transition-all duration-300 ease-in-out relative`}>
            {/* Border toggle button */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute top-5 -right-3.5 z-50 h-7 w-7 rounded-full border shadow-md bg-background"
            >
                {isSidebarCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                )}
            </Button>
            <Card className="h-full rounded-none border-r">
                <CardHeader className="pb-4 px-3">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex-shrink-0">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        {!isSidebarCollapsed && <CardTitle className="text-xl">Matcha</CardTitle>}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4">
                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        {navigationItems.map((item) => (
                            <Button
                                key={item.label}
                                variant={item.active ? "default" : "ghost"}
                                className={`w-full justify-start h-11 ${isSidebarCollapsed ? 'px-2' : 'px-3'
                                    } ${item.active ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600' : ''}`}
                                onClick={item.label === 'Notification' ? handleNotificationClick : undefined}
                                asChild={item.label !== 'Notification'}
                            >
                                {item.label === 'Notification' ? (
                                    <div className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            {unreadCount > 0 && (
                                                // <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
                                                <Badge className="absolute -top-2 -right-2 flex items-center justify-center h-4 w-4 text-xs rounded-full bg-red-500 border border-white">
                                                
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <span className="ml-3 truncate">{item.label}</span>
                                        )}
                                    </div>
                                ) : (
                                    <Link href={item.href} className="flex items-center">
                                        <div className="relative">
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            {item.badge && (
                                                <Badge className="absolute -top-2 -right-2 flex items-center justify-center h-4 w-4 text-xs rounded-full bg-red-500 border border-white">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <span className="ml-3 truncate">{item.label}</span>
                                        )}
                                    </Link>
                                )}
                            </Button>
                        ))}
                    </nav>

                    <Separator className="my-4" />

                    <Button
                        variant="ghost"
                        className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 ${isSidebarCollapsed ? 'px-2' : 'justify-start'
                            }`}
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!isSidebarCollapsed && <span className="ml-3">Logout</span>}
                    </Button>
                </CardContent>
            </Card>
        </div >
    );

}