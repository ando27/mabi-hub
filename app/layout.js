import './globals.css'

export const metadata = {
  title: 'MABI Hub',
  description: 'AI Toolkit for the Marketing Automation & Business Intelligence Team',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
