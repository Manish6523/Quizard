// src/components/EditProfileDialog.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, User } from "lucide-react";
import client from "@/api/client";
import useAuth from "@/hook/useAuth";
import { toast } from "sonner";

export function EditProfileDialog({ user }) {
  const { refetchUser } = useAuth();

  const [fullName, setFullName] = useState(user?.profile.full_name || "");
  const [username, setUsername] = useState(user?.profile.username || "");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);

    // Don't update if nothing has changed
    if (
      fullName === user?.profile.full_name &&
      username === user?.profile.username
    ) {
      setLoading(false);
      setIsOpen(false);
      return;
    }

    // Pattern validation for username
    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    if (!usernamePattern.test(username)) {
      toast.error(
        "Username can only contain letters, numbers, and underscores."
      );
      setLoading(false);
      return;
    }

    try {
      const { error } = await client
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      setLoading(false);

      if (error) {
        toast.error("Username already exists.");
        return;
      } else {
        toast.success("Profile updated successfully.");
        refetchUser(); // Refetch user data to update context
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("An error occurred while updating your profile.");
      setIsOpen(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={"p-3"}>
          <span className={"hidden md:flex"}>Edit Profile</span>
          <span className={"flex md:hidden "}>
            <Pencil />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              pattern="^[a-zA-Z0-9_]+$"
              title="Username can only contain letters, numbers, and underscores."
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
