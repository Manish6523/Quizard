"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import client from "@/api/client";
import useAuth from "@/hook/useAuth";

// Google Icon
function GoogleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="24px"
      height="24px"
      {...props}
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.1,4.215-3.821,5.639l6.19,5.238C42.011,35.638,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function Page() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [view, setView] = useState("email_entry");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if(user) {
      router.push("/dashboard");
    }
  }, []);

  const handleContinueWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/auth/v1/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setMessage(`${error.message}`);
    } else {
      setMessage("Check your email for the login code.");
      setView("otp_entry");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    setLoading(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/auth/v1/callback`,
      },
    });
  };

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            {view === "email_entry"
              ? "Enter your email to receive a login code."
              : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "email_entry" ? (
            <form onSubmit={handleContinueWithEmail} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Continue with Email"}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignInWithGoogle}
                disabled={loading}
              >
                <GoogleIcon className="mr-2" />
                Continue with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              <div className="grid gap-2 text-center">
                <Label htmlFor="otp">Enter your code</Label>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>
          )}

          {message && (
            <p className="text-sm text-center text-muted-foreground mt-4">
              {message}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            {view === "otp_entry" && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setView("email_entry");
                  setMessage("");
                }}
              >
                Back to email
              </Button>
            )}
            {view === "email_entry" && (
              <p className="text-muted-foreground text-center">
                Don’t have an account? A code will create one automatically.
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
