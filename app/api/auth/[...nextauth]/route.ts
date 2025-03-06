import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

// Debug helper
const debug = (message: string, data?: any) => {
  console.log(`[NextAuth] ${message}`, data ? data : "");
};

export const authOptions: NextAuthOptions = {
  debug: true, // Enable NextAuth.js debug mode
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        debug("Authorize function called with credentials", {
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials?.password) {
          debug("Missing email or password");
          return null;
        }

        try {
          debug("Connecting to MongoDB");
          const client = await MongoClient.connect(
            process.env.MONGODB_URI as string
          );
          const db = client.db();

          debug("Looking up user by email", { email: credentials.email });
          const user = await db
            .collection("users")
            .findOne({ email: credentials.email });

          if (!user) {
            debug("User not found");
            client.close();
            return null;
          }

          debug("User found, verifying password");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            debug("Password validation failed");
            client.close();
            return null;
          }

          debug("Authentication successful", { userId: user._id });
          client.close();

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          debug("Error during authentication", error);
          console.error("Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      debug("JWT callback", {
        token,
        userId: user?.id,
        accountType: account?.provider,
      });

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      debug("Session callback", {
        sessionUser: session.user,
        tokenId: token.id,
      });

      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      debug("Sign in event", {
        user: message.user.email,
        isNewUser: message.isNewUser,
      });
    },
    async signOut(message) {
      debug("Sign out event", { user: message.token.email });
    },
    async error(message) {
      debug("Error event", { error: message.error });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
