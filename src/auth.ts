import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma, { getPrisma, teacherPrisma } from "@/lib/prisma"
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
      checks: ["none"],
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
          let targetDb = prisma
          try {
            const cookieStore = await cookies()
            const intentRole = cookieStore.get("login_role_intent")?.value
            targetDb = getPrisma(intentRole)
          } catch (e) {}

          const user = await targetDb.user.findUnique({ where: { email } })
          if (!user || !user.password) return null
          
          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (passwordsMatch) return { id: user.id, email: user.email, name: user.name, role: user.role }
        }
        return null
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        const urlObj = new URL(url)
        if (urlObj.origin === baseUrl || urlObj.hostname.includes("localhost") || urlObj.hostname.includes("dolcake.com")) {
          return url
        }
      } catch (e) {}
      return baseUrl
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        let intentRole: string | undefined
        try {
          const cookieStore = await cookies()
          intentRole = cookieStore.get("login_role_intent")?.value
        } catch (e) {}

        const targetDb = getPrisma(intentRole)
        let dbUser = await targetDb.user.findUnique({ where: { email: user.email } })

        if (!dbUser && intentRole) {
          dbUser = await targetDb.user.upsert({
            where: { email: user.email },
            update: { role: intentRole as any },
            create: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              image: user.image,
              role: intentRole as any,
            }
          })
        } else if (dbUser && intentRole && dbUser.role !== intentRole) {
          await targetDb.user.update({
            where: { email: user.email },
            data: { role: intentRole as any }
          })
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (token.email) {
        try {
          const cookieStore = await cookies()
          const intentRole = cookieStore.get("login_role_intent")?.value

          if (intentRole === "TEACHER") {
            token.role = "TEACHER"
          } else {
            const teacherUser = await teacherPrisma.user.findUnique({
              where: { email: token.email },
              select: { role: true }
            })
            if (teacherUser) {
              token.role = teacherUser.role || "TEACHER"
            }
          }
        } catch (e) {}
      }
      if (user && !token.role) {
        token.role = (user as any).role || "STUDENT"
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
