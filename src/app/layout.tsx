import type { Metadata, Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import Footer from '@/components/layout/Footer'
import UpdateSnackbar from '@/components/ui/UpdateSnackbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'SFXProOne CaseManager',
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
    title: 'CaseManager',
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
    <html lang="en" className="dark">
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
