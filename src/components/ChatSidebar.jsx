"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  SquarePen,
  Frame,
  Loader2,
  Map,
  PieChart,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ChatHeader } from "./ChatHeader";
import useAuth from "@/hook/useAuth";
import { useRouter } from "next/navigation";

// This is sample data.

export function ChatSidebar({ ...props }) {
  const { user, avatar, loading, handleSignOut, fetchChats } = useAuth();
  const router = useRouter();

  console.log("ChatSidebar props:", props.chatslist);

  const data = {
    navMain: [
      {
        title: "New Chat",
        url: "/quizzes/new",
        icon: SquarePen,
        show: false,
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        show: false,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
      {
        title: "All Chats",
        url: "/quizzes/chat",
        icon: Bot,
        show: true,
        isActive: props.chatslist,
        items: [
          ...props.chatslist
        ],
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  };



  React.useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ChatHeader/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {user && avatar ? (
          <NavUser user={user} avatar={avatar} handleSignOut={handleSignOut} />
        ) : (
          <Loader2 className="animate-spin" />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
