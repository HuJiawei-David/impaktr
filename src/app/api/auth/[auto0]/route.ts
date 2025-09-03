// home/ubuntu/impaktrweb/src/app/api/auth/[auth0]/route.ts

import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/onboarding'
  }),
  logout: handleLogout({
    returnTo: '/'
  }),
  callback: handleCallback({
    afterCallback: async (req: NextRequest, session: any) => {
      // Create or update user in database after successful login
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth0Id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
          }),
        });

        if (!response.ok) {
          console.error('Failed to sync user:', await response.text());
        }
      } catch (error) {
        console.error('Error syncing user:', error);
      }

      return session;
    }
  })
});