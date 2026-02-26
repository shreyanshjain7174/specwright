import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Specwright — Cursor for Product Management",
  description: "Transform chaotic product inputs into deterministic, traceable specifications for AI coding tools. The reasoning engine that stops hallucinated features.",
  keywords: ["product management", "specifications", "AI", "reasoning engine", "context intelligence"],
  openGraph: {
    title: "Specwright — Cursor for Product Management",
    description: "Transform chaos into executable specifications. AI-powered context intelligence for product teams.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
