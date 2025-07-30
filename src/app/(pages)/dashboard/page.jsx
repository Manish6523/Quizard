"use client";
import { useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  User,
  FileText,
  Settings,
  BarChart3,
  CreditCard,
  Menu,
  Sparkles,
} from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import useAuth from "@/hook/useAuth";
import { QuizList } from "@/components/QuizList";

// --- Placeholder Components ---
const AnalyticsView = () => (
  <Card>
    <CardHeader>
      <CardTitle>Analytics</CardTitle>
      <CardDescription>
        Analytics and reports will be displayed here.
      </CardDescription>
    </CardHeader>
  </Card>
);
const SettingsView = () => (
  <Card>
    <CardHeader>
      <CardTitle>Settings</CardTitle>
      <CardDescription>
        User and application settings will be here.
      </CardDescription>
    </CardHeader>
  </Card>
);
const BillingView = () => (
  <Card>
    <CardHeader>
      <CardTitle>Billing</CardTitle>
      <CardDescription>
        Billing information and history will be here.
      </CardDescription>
    </CardHeader>
  </Card>
);

// --- Main Profile View ---
const ProfileView = ({ user, avatar }) => (
  <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatar && <AvatarImage src={avatar} />}
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl md:text-2xl">
              {user?.profile?.full_name || "Welcome!"}
            </CardTitle>
            <CardDescription>
              @{user?.profile?.username || "username"}
            </CardDescription>
          </div>
        </div>
        <EditProfileDialog user={user} />
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p>{user?.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Role</p>
          <p className="capitalize">{user?.profile?.role}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Member Since
          </p>
          <p>{new Date(user?.created_at).toLocaleDateString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Last Sign In
          </p>
          <p>{new Date(user?.last_sign_in_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  </>
);

// Icon mapping
const icons = { FileText, BarChart3, Settings, CreditCard, User };

export default function DashboardPage() {

  const { user, loading, avatar } = useAuth();
  console.log("avatar", avatar);

  const [activeView, setActiveView] = useState("Profile");
  // State to control the mobile sheet's open/closed status
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!loading && !user) {
    redirect("/login");
  }

  const dashboardNav = [
    { name: "Profile", icon: "User" },
    { name: "My Quizzes", icon: "FileText" },
    { name: "Analytics", icon: "BarChart3" },
    { name: "Settings", icon: "Settings" },
    { name: "Billing", icon: "CreditCard" },
  ];

  const handleNavClick = (view) => {
    setActiveView(view);
    // Close the sheet after navigation on mobile
    setIsSheetOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case "Profile":
        return <ProfileView user={user} avatar={avatar} />;
      case "My Quizzes":
        return <QuizList />;
      case "Analytics":
        return <AnalyticsView />;
      case "Settings":
        return <SettingsView />;
      case "Billing":
        return <BillingView />;
      default:
        return <ProfileView user={user} />;
    }
  };


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Quick Access</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
              {dashboardNav.map((item) => {
                const IconComponent = icons[item.icon];
                const isActive = activeView === item.name;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className="flex items-center gap-3 justify-start px-3 py-2"
                    onClick={() => handleNavClick(item.name)}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {item.name}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* --- Mobile Header & Main Content --- */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* === MOBILE MENU RESTORED HERE === */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold"
                  >
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span>Quick Access</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium mt-6 px-2">
                {dashboardNav.map((item) => {
                  const IconComponent = icons[item.icon];
                  const isActive = activeView === item.name;
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "secondary" : "ghost"}
                      className="flex items-center gap-4 justify-start px-3 py-2"
                      onClick={() => handleNavClick(item.name)}
                    >
                      {IconComponent && <IconComponent className="h-5 w-5" />}
                      {item.name}
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          {/* === END OF RESTORED MENU === */}
          <div className="w-full flex-1 text-center">
            {/* Display the active view name in the header */}
            <h1 className="text-xl font-semibold">{activeView}</h1>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {loading ? <p>Loading...</p> : renderContent()}
        </main>
      </div>
    </div>
  );
}
