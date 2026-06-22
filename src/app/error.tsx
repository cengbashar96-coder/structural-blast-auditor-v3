'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل الخطأ في الكونسول دائماً (حتى في الإنتاج)
    console.error('[APP ERROR]', {
      message: error.message,
      digest: error.digest,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    });
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
      padding: '1rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          {error.message || 'حدث خطأ في تحميل الصفحة'}
        </h2>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', direction: 'ltr' }}>
            Error Reference: {error.digest}
          </p>
        )}
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
          إذا استمرت المشكلة، جرب مسح كاش المتصفح أو افتح الصفحة في وضع التخفي.
        </p>
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
            onClick={() => window.location.href = '/auth/login'}
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
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}
