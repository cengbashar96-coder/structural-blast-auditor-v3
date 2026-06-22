/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏥 API Route تشخيصي — Health Check & Environment Diagnostic
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يفحص كل المتطلبات الأساسية ويعيد تقريراً مفصلاً
 * GET /api/health
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: { name: string; status: 'ok' | 'fail'; detail?: string }[] = [];

  // ─── 1. متغيرات البيئة ───
  const envVars = [
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
  ];

  for (const v of envVars) {
    const exists = !!process.env[v];
    const value = process.env[v] || '';
    checks.push({
      name: `env:${v}`,
      status: exists ? 'ok' : 'fail',
      detail: exists ? `${value.length} chars` : 'NOT SET',
    });
  }

  // ─── 2. node:crypto ───
  try {
    const { randomBytes } = await import('node:crypto');
    randomBytes(4);
    checks.push({ name: 'node:crypto', status: 'ok' });
  } catch (e: unknown) {
    checks.push({ name: 'node:crypto', status: 'fail', detail: (e as Error).message });
  }

  // ─── 3. bcryptjs ───
  try {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('test', 4);
    const valid = await bcrypt.compare('test', hash);
    checks.push({ name: 'bcryptjs', status: valid ? 'ok' : 'fail' });
  } catch (e: unknown) {
    checks.push({ name: 'bcryptjs', status: 'fail', detail: (e as Error).message });
  }

  // ─── 4. CryptoVault ───
  try {
    const { getCryptoVault } = await import('@/lib/crypto-vault');
    const vault = getCryptoVault();
    const enc = vault.encrypt('health-check');
    const dec = vault.decrypt(enc);
    checks.push({ name: 'CryptoVault', status: dec === 'health-check' ? 'ok' : 'fail' });
  } catch (e: unknown) {
    checks.push({ name: 'CryptoVault', status: 'fail', detail: (e as Error).message });
  }

  // ─── 5. Supabase REST API ───
  try {
    const { checkDatabaseConnection } = await import('@/lib/db/prisma');
    const conn = await checkDatabaseConnection();
    checks.push({ name: 'SupabaseDB', status: conn.ok ? 'ok' : 'fail', detail: conn.error || conn.method });
  } catch (e: unknown) {
    checks.push({ name: 'SupabaseDB', status: 'fail', detail: (e as Error).message });
  }

  // ─── 6. Cookies API ───
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    checks.push({ name: 'cookies()', status: 'ok', detail: `${cookieStore.getAll().length} cookies` });
  } catch (e: unknown) {
    checks.push({ name: 'cookies()', status: 'fail', detail: (e as Error).message });
  }

  const allOk = checks.every((c) => c.status === 'ok');

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    checks,
  }, { status: allOk ? 200 : 503 });
}
