import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';

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
export default ProfileView