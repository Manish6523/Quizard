// src/components/UserNav.jsx
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import ThemeToggler from "./ThemeToggler";
import useAuth from "@/hook/useAuth";

export function UserNav({ user }) {
  const router = useRouter();

  const { handleSignOut, coin, avatar } = useAuth();

  const handleLogOut = async () => {
    handleSignOut();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <Badge variant={"outline"}>
            <Coins className="text-amber-500" />
            <span> {coin} </span>
          </Badge>
          <ThemeToggler />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {avatar ? (
                    <AvatarImage src={avatar} referrerPolicy="no-referrer" />
                  ) : (
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email || "No email provided"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/quizzes/new">New Quiz</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleLogOut()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <ThemeToggler />
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </>
      )}
    </div>
  );
}
