import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hello World - Vercel Test',
  description: 'Simple Hello World website for Vercel deployment test',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
