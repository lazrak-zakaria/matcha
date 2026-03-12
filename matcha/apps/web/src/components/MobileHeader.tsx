import { Bell, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";



export default function MobileHeader() {
    const unreadCount = 3;
    const handleNotificationClick = () => {
        console.log("Navigating to notifications...");
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
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/api/placeholder/32/32" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    );
}