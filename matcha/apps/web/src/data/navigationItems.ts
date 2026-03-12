
import { 
  Heart, 
  MessageCircle, 
  User, 
  Home,
  Bell,
} from 'lucide-react';
export const navigationItems = [
    { icon: Home, label: 'Home', href: '/home', active: true },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Bell, label: 'Notification', href: '/notification' },
    // { icon: Heart, label: 'Discover', href: '/discover' },
    { icon: MessageCircle, label: 'Chat', href: '/chat', badge: 3 },
  ];
