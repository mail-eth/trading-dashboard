import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ellie Trading Dashboard',
  description: 'AI-powered crypto trading dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}