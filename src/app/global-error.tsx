'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        margin: 0,
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
        padding: '1rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>خطأ في التطبيق</h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            {error.message || 'حدث خطأ غير متوقع'}
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
              مرجع الخطأ: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#475569',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
