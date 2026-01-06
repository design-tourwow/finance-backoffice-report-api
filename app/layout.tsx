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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
