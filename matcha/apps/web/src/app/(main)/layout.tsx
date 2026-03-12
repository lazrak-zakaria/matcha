'use client'

import DesktopSideBar from '@/components/DesktopSideBar';
import MobileBottom from '@/components/MobileBottom';
import MobileHeader from '@/components/MobileHeader';
import AuthGuard from '@/components/providers/AuthGuard';
import { useState } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  return (
    <AuthGuard>
      <DesktopSideBar isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <MobileHeader />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
        }`}>
        {children}

      </div>
      <MobileBottom />
    </AuthGuard>
  );
}