import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    console.log("[Debug] Testing MongoDB connection");
    const client = await clientPromise;
    const db = client.db();

    // Perform a simple operation to verify the connection
    const result = await db.command({ ping: 1 });

    console.log("[Debug] MongoDB connection successful", result);
    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
    });
  } catch (error) {
    console.error("[Debug] MongoDB connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
