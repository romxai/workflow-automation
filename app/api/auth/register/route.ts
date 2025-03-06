import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  console.log("Registration API called");

  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log("Registration request received for:", { name, email });

    // Validate input
    if (!name || !email || !password) {
      console.error("Missing required fields:", {
        name: !!name,
        email: !!email,
        password: !!password,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB");
    const client = await clientPromise;
    const db = client.db();
    console.log("Connected to MongoDB database");

    // Check if user already exists
    console.log("Checking if user already exists");
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      console.log("User already exists with email:", email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    console.log("Hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("Creating new user in database");
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    console.log("User created successfully with ID:", result.insertedId);
    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error details:", error);
    return NextResponse.json(
      {
        error: "An error occurred during registration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
