import './globals.css'
import { Inter } from 'next/font/google'
import SyncProvider from './sync-provider'
import { AuthProvider } from './auth-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Medical Lab Pro',
  description: 'Advanced Lab & Patient Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
