"use client";
import LoginForm from "@/feature/auth/login";
import SignupForm from "@/feature/auth/register";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {


  const {token, isHydrated} = useAuthStore();
  
  console.log("Home page token:", token); // Debugging line

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1>You are already logged in</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}

