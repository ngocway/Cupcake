import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { cookies } from "next/headers"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" },
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user || !user.password) return null
          
          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (passwordsMatch) return { id: user.id, email: user.email, name: user.name, role: user.role }
        }
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        let intentRole: string | undefined
        try {
          const cookieStore = await cookies()
          intentRole = cookieStore.get("login_role_intent")?.value
        } catch (e) {}

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })

        if (dbUser) {
          const currentRole = dbUser.role || "STUDENT"
          
          // Role conflict check: Reject if student tries to login as teacher or vice versa
          if (intentRole === "TEACHER" && currentRole === "STUDENT") {
            return "/?error=RoleStudentExists"
          }
          if (intentRole === "STUDENT" && currentRole === "TEACHER") {
            return "/?error=RoleTeacherExists"
          }
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        let userRole = (user as any).role
        try {
          const cookieStore = await cookies()
          const intentRole = cookieStore.get("login_role_intent")?.value
          
          if (intentRole === "TEACHER" && token.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
            if (dbUser && dbUser.role !== "TEACHER") {
              await prisma.user.update({
                where: { email: token.email },
                data: { role: "TEACHER" }
              })
              userRole = "TEACHER"
            }
          }
        } catch (e) {}
        token.role = userRole
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | null
        session.user.id = token.sub as string
      }
      return session
    }
  }
})
