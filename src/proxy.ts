import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/surf/:path*",
    "/websites/:path*",
    "/campaigns/:path*",
    "/analytics/:path*",
    "/credits/:path*",
    "/achievements/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/invite/:path*",
    "/mail/:path*",
    "/store/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/referrals",
  ],
};
