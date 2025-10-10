//home/ubuntu/impaktrweb/src/app/layout.tsx

import './globals.css';
import { Ubuntu, Raleway } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Navigation } from '@/components/layout/Navigation';

const ubuntu = Ubuntu({ 
  subsets: ['latin'],
  variable: '--font-ubuntu',
  weight: ['300', '400', '500', '700']
});

const raleway = Raleway({ 
  subsets: ['latin'],
  variable: '--font-raleway',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata = {
  title: {
    default: 'Impaktr - Global Standard for Verified Social Impact',
    template: '%s | Impaktr'
  },
  description: 'The first global platform to measure, verify, and benchmark social impact. Earn verified Impact Scores, SDG badges, and shareable certificates for volunteering, donations, and CSR activities.',
  keywords: [
    'volunteering',
    'CSR',
    'ESG',
    'social impact',
    'SDG',
    'sustainability',
    'corporate social responsibility',
    'impact measurement',
    'verified volunteering',
    'social good'
  ],
  authors: [{ name: 'Impaktr Team' }],
  creator: 'Impaktr',
  publisher: 'Impaktr',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://impaktr.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://impaktr.com',
    title: 'Impaktr - Global Standard for Verified Social Impact',
    description: 'The first global platform to measure, verify, and benchmark social impact. Earn verified Impact Scores, SDG badges, and shareable certificates.',
    siteName: 'Impaktr',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Impaktr - Global Standard for Verified Social Impact'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Impaktr - Global Standard for Verified Social Impact',
    description: 'The first global platform to measure, verify, and benchmark social impact.',
    images: ['/twitter-image.jpg'],
    creator: '@impaktrcom'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${raleway.variable} ${ubuntu.variable} font-sans`}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <SocketProvider>
                <Navigation />
                <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
                  {children}
                </div>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                    success: {
                      iconTheme: {
                        primary: 'hsl(var(--primary))',
                        secondary: 'hsl(var(--primary-foreground))',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'hsl(var(--destructive))',
                        secondary: 'hsl(var(--destructive-foreground))',
                      },
                    },
                  }}
                />
              </SocketProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}