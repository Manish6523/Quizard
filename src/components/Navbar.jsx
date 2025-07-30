"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import useAuth from "@/hook/useAuth";
import { UserNav } from "./UserNav";

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Quizard</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Testimonials
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-24 h-8 bg-muted rounded-md animate-pulse"></div> // Skeleton loader
        ) : (
          <UserNav user={user} loading={loading} />
        )}
      </div>
    </header>
  );
}
