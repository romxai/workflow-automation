"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Debug: Log session status
  useEffect(() => {
    console.log("Auth Status:", status);
    console.log("Session:", session);

    if (status === "authenticated") {
      console.log("User is authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempt with:", {
      name: formData.name,
      email: formData.email,
    });

    if (formData.password !== formData.confirmPassword) {
      console.error("Password mismatch");
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending registration request to API");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log("Registration API response status:", response.status);
      const data = await response.json();
      console.log("Registration API response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully");
      console.log("Registration successful, attempting to sign in");

      // Sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("SignIn result after registration:", signInResult);

      if (signInResult?.error) {
        console.error(
          "Auto-login after registration failed:",
          signInResult.error
        );
        toast.error(
          "Account created but login failed. Please try logging in manually."
        );
        router.push("/auth/login");
      } else {
        console.log("Auto-login successful, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Initiating Google sign-in");
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGithubSignIn = () => {
    console.log("Initiating GitHub sign-in");
    signIn("github", { callbackUrl: "/dashboard" });
  };

  // If already authenticated, redirect to dashboard
  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Already logged in, redirecting...</p>
      </div>
    );
  }

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to create a new account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGithubSignIn}
              type="button"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
      </form>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
