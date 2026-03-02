import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResVysion — Slim reserveren voor horeca',
  description: 'Het complete reserveringsplatform voor restaurants en horecazaken. Tafelplan, online boeking, gasten CRM en no-show bescherming.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
