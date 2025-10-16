import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from '@/lib/prisma'

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const bcrypt = await import('bcryptjs')
          const { prisma } = await import('@/lib/prisma')

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          // Check if user has a password (for credentials login)
          const userWithPassword = user as any
          if (!userWithPassword.password) {
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, userWithPassword.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            image: user.image || null,
            userType: user.userType || 'INDIVIDUAL',
            profileComplete: !!(user.firstName && user.lastName),
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // Include user info in JWT token
        if (user) {
          token.id = user.id
          token.userType = (user as any).userType
          token.profileComplete = (user as any).profileComplete
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        // Return minimal token on error to prevent crashes
        return token
      }
    },
    async session({ session, token }) {
      try {
        // Include token info in session
        if (token && session.user) {
          session.user.id = token.id as string
          session.user.userType = token.userType as string
          session.user.profileComplete = token.profileComplete as boolean
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // Return minimal session on error
        return session
      }
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      try {
        // For OAuth providers, sync user with database
        if (account?.provider !== 'credentials' && user.email) {
          // Sync OAuth user with database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            // Create new user from OAuth
            await prisma.user.create({
              data: {
                email: user.email!,
                userType: 'INDIVIDUAL', // Default for OAuth users
              }
            })
          }
        }
        return true
      } catch (error) {
        console.error('Sign-in error:', error)
        return false
      }
    },
  },
  session: {
    strategy: 'jwt' as const, // Changed to JWT for middleware compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Force token refresh on secret change by encoding version
    encode: async ({ token, secret }) => {
      const jose = await import('jose')
      const secretKey = typeof secret === 'string' ? secret : String(secret)
      return await new jose.EncryptJWT({ ...token, v: 1 })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .encrypt(new TextEncoder().encode(secretKey))
    },
    decode: async ({ token, secret }) => {
      try {
        const jose = await import('jose')
        const secretKey = typeof secret === 'string' ? secret : String(secret)
        const { payload } = await jose.jwtDecrypt(
          token!,
          new TextEncoder().encode(secretKey),
          { clockTolerance: 15 }
        )
        return payload as any
      } catch (error: any) {
        console.warn('JWT decode error (likely old token):', error?.message || 'Unknown error')
        // Return null to force re-authentication with old tokens
        return null
      }
    }
  },
  pages: {
    signIn: '/signin',
    signOut: '/',
    error: '/signin',
    newUser: '/profile-setup'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
