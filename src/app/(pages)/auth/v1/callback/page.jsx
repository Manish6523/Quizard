"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import client from "@/api/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      // Supabase will automatically parse the URL fragment and set the session
      const { data, error } = await client.auth.getSessionFromUrl({ storeSession: true });
      if (!error) {
        // After login, redirect to dashboard
        router.replace("/dashboard");
      } else {
        // If something goes wrong, go to login
        router.replace("/login");
      }
    };
    handleRedirect();
  }, [router]);

  return <p>Logging you in...</p>;
}
