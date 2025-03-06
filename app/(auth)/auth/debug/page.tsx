"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AuthDebugPage() {
  const { data: session, status, update } = useSession();
  const [mongoStatus, setMongoStatus] = useState<
    "loading" | "connected" | "error"
  >("loading");
  const [mongoError, setMongoError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check MongoDB connection
    fetch("/api/auth/debug/mongo")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMongoStatus("connected");
        } else {
          setMongoStatus("error");
          setMongoError(data.error);
        }
      })
      .catch((err) => {
        setMongoStatus("error");
        setMongoError(err.message);
      });

    // Check environment variables
    fetch("/api/auth/debug/env")
      .then((res) => res.json())
      .then((data) => {
        setEnvVars(data);
      })
      .catch((err) => {
        console.error("Failed to check environment variables:", err);
      });
  }, []);

  const refreshSession = () => {
    update();
  };

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>
          Diagnose authentication issues and check system status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Session Status</h3>
          <div className="bg-muted p-4 rounded-md">
            <p>
              <strong>Status:</strong> {status}
            </p>
            {status === "loading" ? (
              <div className="flex items-center mt-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading session...</span>
              </div>
            ) : status === "authenticated" ? (
              <div className="mt-2 space-y-1">
                <p>
                  <strong>User ID:</strong> {session?.user?.id}
                </p>
                <p>
                  <strong>Name:</strong> {session?.user?.name}
                </p>
                <p>
                  <strong>Email:</strong> {session?.user?.email}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-yellow-600">Not authenticated</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={refreshSession}
            >
              Refresh Session
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">MongoDB Status</h3>
          <div className="bg-muted p-4 rounded-md">
            {mongoStatus === "loading" ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Checking connection...</span>
              </div>
            ) : mongoStatus === "connected" ? (
              <p className="text-green-600">Connected to MongoDB</p>
            ) : (
              <div className="space-y-1">
                <p className="text-red-600">Failed to connect to MongoDB</p>
                {mongoError && (
                  <p className="text-sm text-muted-foreground">{mongoError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Environment Variables</h3>
          <div className="bg-muted p-4 rounded-md">
            <ul className="space-y-1">
              <li>
                <strong>NEXTAUTH_URL:</strong>{" "}
                {envVars.NEXTAUTH_URL ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </li>
              <li>
                <strong>NEXTAUTH_SECRET:</strong>{" "}
                {envVars.NEXTAUTH_SECRET ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </li>
              <li>
                <strong>MONGODB_URI:</strong>{" "}
                {envVars.MONGODB_URI ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </li>
              <li>
                <strong>GITHUB_ID:</strong>{" "}
                {envVars.GITHUB_ID ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-yellow-600">Missing (Optional)</span>
                )}
              </li>
              <li>
                <strong>GITHUB_SECRET:</strong>{" "}
                {envVars.GITHUB_SECRET ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-yellow-600">Missing (Optional)</span>
                )}
              </li>
              <li>
                <strong>GOOGLE_ID:</strong>{" "}
                {envVars.GOOGLE_ID ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-yellow-600">Missing (Optional)</span>
                )}
              </li>
              <li>
                <strong>GOOGLE_SECRET:</strong>{" "}
                {envVars.GOOGLE_SECRET ? (
                  <span className="text-green-600">Set</span>
                ) : (
                  <span className="text-yellow-600">Missing (Optional)</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
