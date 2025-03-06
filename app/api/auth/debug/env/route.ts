import { NextResponse } from "next/server";

export async function GET() {
  console.log("[Debug] Checking environment variables");

  // Check if environment variables are set (without exposing their values)
  const envStatus = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    GITHUB_ID: !!process.env.GITHUB_ID,
    GITHUB_SECRET: !!process.env.GITHUB_SECRET,
    GOOGLE_ID: !!process.env.GOOGLE_ID,
    GOOGLE_SECRET: !!process.env.GOOGLE_SECRET,
  };

  console.log("[Debug] Environment variables status:", envStatus);
  return NextResponse.json(envStatus);
}
