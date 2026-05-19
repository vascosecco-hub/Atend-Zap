import { Poppins, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Atendimentos WhatsApp',
  description: 'Sistema de pré-atendimento WhatsApp para PMEs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} ${inter.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}