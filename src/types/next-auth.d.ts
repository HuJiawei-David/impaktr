import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      userType?: string
      profileComplete?: boolean
    }
  }

  interface User {
    id: string
    userType?: string
    profileComplete?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userType?: string
    profileComplete?: boolean
  }
}
