export const metadata = {
  title: 'Finance Backoffice Report API',
  description: 'API for Finance Backoffice Report System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
