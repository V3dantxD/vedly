import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { connectDB } from "./db";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email });
          if (!existing) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              googleId: account.providerAccountId,
              defaultCurrency: "INR",
              timezone: "Asia/Kolkata",
            });
          } else if (!existing.googleId) {
            existing.googleId = account.providerAccountId;
            if (user.image) existing.image = user.image;
            await existing.save();
          }
        } catch (err) {
          console.error("signIn callback error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.defaultCurrency = dbUser.defaultCurrency;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.defaultCurrency = (token.defaultCurrency as string) ?? "INR";
      }
      return session;
    },
  },
});
