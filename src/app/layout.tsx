import type { Metadata, Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import Footer from '@/components/layout/Footer'
import UpdateSnackbar from '@/components/ui/UpdateSnackbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inventory Manager',
  description: 'Flight case inventory and QR code management',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Inventory Manager',
    startupImage: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Inline script: set theme class before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var stored = localStorage.getItem('theme');
            var theme = stored === 'light' || stored === 'dark'
              ? stored
              : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            document.documentElement.className = theme;
          })();
        `}} />
      </head>
      <body>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            {children}
            <Footer />
            <UpdateSnackbar />
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
