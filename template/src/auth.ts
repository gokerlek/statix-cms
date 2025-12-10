import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account: _account, profile: _profile }) {
      // Check if user email is in the whitelist
      const adminEmails =
        process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()) || [];

      if (!user.email) {
        return false;
      }

      if (!adminEmails.includes(user.email)) {
        console.log(`Access denied for ${user.email} - not in whitelist`);

        return false;
      }

      return true;
    },
    async session({ session, token: _token }) {
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
