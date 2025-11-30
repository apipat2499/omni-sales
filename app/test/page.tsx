export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f97316',
      color: 'white',
      fontSize: '2rem',
      fontWeight: 'bold'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉 TEST PAGE</h1>
        <p>If you see this, React is working!</p>
        <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
          URL: /test
        </p>
      </div>
    </div>
  );
}
