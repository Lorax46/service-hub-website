import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Service Hub',
  description: 'Plataforma de gerenciamento de usuários, grupos e ferramentas',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png?v=totvs',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png?v=totvs',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg?v=totvs',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png?v=totvs',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  )
}
