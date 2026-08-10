import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthed = !!auth?.user;
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/surf") ||
        pathname.startsWith("/websites") ||
        pathname.startsWith("/campaigns") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/credits") ||
        pathname.startsWith("/achievements") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/admin") ||
        (pathname.startsWith("/rewards") && !pathname.startsWith("/rewards/public"));
      const isAdmin = pathname.startsWith("/admin");

      if (isAuthPage && isAuthed) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      if (isProtected && !isAuthed) return false;
      if (isAdmin) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        if (!role || !["admin", "founder", "moderator"].includes(role)) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.referralCode = (user as { referralCode?: string }).referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { referralCode?: string }).referralCode =
          token.referralCode as string;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
