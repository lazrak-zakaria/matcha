
import { 
  Heart, 
  MessageCircle, 
  User, 
  Home,
  Bell,
  Search,
} from 'lucide-react';
export const navigationItems = [
    { icon: Home, label: 'Home', href: '/home', active: true },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Bell, label: 'Notification', href: '/notification' },
    // { icon: Heart, label: 'Discover', href: '/discover' },
  { icon: MessageCircle, label: 'Chat', href: '/chat' },
  ];
