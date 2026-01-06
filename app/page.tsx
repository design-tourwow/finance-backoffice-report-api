export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Finance Backoffice Report API</h1>
      <p>API Server is running</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Available Endpoints:</h2>
        <ul>
          <li><code>GET /api/health</code> - Health check</li>
          <li><code>GET /api/reports</code> - Get all reports</li>
          <li><code>POST /api/reports</code> - Create new report</li>
        </ul>
      </div>
    </main>
  )
}
