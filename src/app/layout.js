import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import StyledComponentsRegistry from "@/lib/styled-components-registry"
import AppLayout from "@/components/appLayout"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Stage Share",
  description: "Plateforme d'aide à la recherche de stage pour les étudiants",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StyledComponentsRegistry>
          <AppLayout>{children}</AppLayout>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}