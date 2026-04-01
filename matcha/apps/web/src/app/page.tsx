"use client";
import LoginForm from "@/feature/auth/login";
import SignupForm from "@/feature/auth/register";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

export default function Home() {


  const {token, isHydrated} = useAuthStore();
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'landing'>('login');
  console.log("Home page token:", token); // Debugging line

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (token) {
    return (
      // here i will redirect to /home
      <div className="flex min-h-screen items-center justify-center">
        <h1>You are already logged in</h1>
      </div>
    );
  }

  const handlePageChange = (page: 'login' | 'register') => {
    setCurrentPage(page);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {currentPage === 'login' && <LoginForm handlePageChange={handlePageChange} />}
      {currentPage === 'register' && <SignupForm handlePageChange={handlePageChange}/>}
    </div>
  );
}

