"use client";
import LoginForm from "@/feature/auth/login";
import SignupForm from "@/feature/auth/register";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'landing'>('landing');

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/home');
    }
  }, [isHydrated, token, router]);

  if (!isHydrated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rose-100 text-rose-950">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_12%_18%,rgba(251,113,133,0.28),transparent_35%),radial-gradient(circle_at_80%_82%,rgba(244,114,182,0.22),transparent_40%),linear-gradient(150deg,#fff3f5,#fdf2f8_45%,#fff7f9)]" />
        Loading...
      </div>
    );
  }

  if (token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rose-100 text-rose-950">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_12%_18%,rgba(251,113,133,0.28),transparent_35%),radial-gradient(circle_at_80%_82%,rgba(244,114,182,0.22),transparent_40%),linear-gradient(150deg,#fff3f5,#fdf2f8_45%,#fff7f9)]" />
        Redirecting to home...
      </div>
    );
  }

  const handlePageChange = (page: 'login' | 'register') => {
    setCurrentPage(page);
  }

  if (currentPage === 'login') {
    return <LoginForm handlePageChange={handlePageChange} />;
  }

  if (currentPage === 'register') {
    return <SignupForm handlePageChange={handlePageChange} />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rose-100 px-6">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_14%_16%,rgba(251,113,133,0.32),transparent_35%),radial-gradient(circle_at_86%_76%,rgba(244,114,182,0.24),transparent_38%),linear-gradient(150deg,#fff3f5,#fdf2f8_45%,#fff7f9)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(225,29,72,0.12)_1px,transparent_1px),linear-gradient(to_right,rgba(225,29,72,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-rose-200 bg-rose-50/85 p-10 text-center shadow-2xl shadow-rose-100 backdrop-blur-md sm:p-12">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.32em] text-rose-500">Welcome to Matcha</p>
        <h1 className="text-4xl font-bold text-rose-900 sm:text-5xl">Find your next meaningful connection</h1>
        <p className="mt-5 text-base text-rose-700 sm:text-lg">
          Sign in to continue your conversations, or create an account to start matching.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full bg-rose-600 text-white hover:bg-rose-700 sm:w-40" onClick={() => setCurrentPage('register')}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" className="w-full border-rose-300 bg-rose-50/90 text-rose-700 hover:bg-rose-100 sm:w-40" onClick={() => setCurrentPage('login')}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

