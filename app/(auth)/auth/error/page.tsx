"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string>("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    setError(errorParam);

    // Set error description based on error type
    if (errorParam) {
      switch (errorParam) {
        case "Configuration":
          setErrorDescription(
            "There is a problem with the server configuration. Check if your environment variables are set correctly."
          );
          break;
        case "AccessDenied":
          setErrorDescription("You do not have permission to sign in.");
          break;
        case "Verification":
          setErrorDescription(
            "The verification token has expired or has already been used."
          );
          break;
        case "OAuthSignin":
          setErrorDescription("Error in the OAuth sign-in process.");
          break;
        case "OAuthCallback":
          setErrorDescription("Error in the OAuth callback process.");
          break;
        case "OAuthCreateAccount":
          setErrorDescription("Could not create OAuth provider account.");
          break;
        case "EmailCreateAccount":
          setErrorDescription("Could not create email provider account.");
          break;
        case "Callback":
          setErrorDescription("Error in the OAuth callback handler.");
          break;
        case "OAuthAccountNotLinked":
          setErrorDescription(
            "Email already exists with a different provider."
          );
          break;
        case "EmailSignin":
          setErrorDescription("Error sending the email for sign in.");
          break;
        case "CredentialsSignin":
          setErrorDescription(
            "Invalid credentials. Please check your email and password."
          );
          break;
        case "SessionRequired":
          setErrorDescription("You must be signed in to access this page.");
          break;
        default:
          setErrorDescription(
            "An unknown error occurred during authentication."
          );
      }
    }
  }, [searchParams]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Card className="w-full bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
          <CardDescription>
            There was a problem with your authentication request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md border border-red-200 dark:border-red-900">
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                Error: {error}
              </h3>
              <p className="mt-1 text-red-600 dark:text-red-300">
                {errorDescription}
              </p>
            </div>
          ) : (
            <p>No error details were provided.</p>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">What can you do?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Try signing in again</li>
              <li>Check if you're using the correct credentials</li>
              <li>If you're using a social login, try a different provider</li>
              <li>Clear your browser cookies and try again</li>
              <li>If the problem persists, contact support</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button asChild variant="default">
            <Link href="/auth/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/debug">Debug Info</Link>
          </Button>
        </CardFooter>
      </Card>
    </Suspense>
  );
}
