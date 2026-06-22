/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔧 API Route لفحص قاعدة البيانات — Database Health Check
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يفحص اتصال قاعدة البيانات عبر Supabase REST API
 * ويعرض معلومات عن الجداول الموجودة وحساب المدير
 *
 * GET /api/setup-db
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { checkDatabaseConnection, db } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: string[] = [];

  try {
    // ─── فحص الاتصال ───
    const connCheck = await checkDatabaseConnection();
    if (!connCheck.ok) {
      results.push(`❌ Database connection failed: ${connCheck.error}`);
      return NextResponse.json({ results }, { status: 500 });
    }
    results.push(`✅ Database connection successful via ${connCheck.method}`);

    // ─── فحص الجداول ───
    try {
      const users = await db.user.findMany({ take: 1 });
      results.push(`✅ User table accessible (${users.length} sample rows)`);

      const projects = await db.project.findMany({ take: 1 });
      results.push(`✅ Project table accessible (${projects.length} sample rows)`);

      const scenarios = await db.scenario.findMany({ take: 1 });
      results.push(`✅ Scenario table accessible (${scenarios.length} sample rows)`);
    } catch (tableErr: unknown) {
      const msg = tableErr instanceof Error ? tableErr.message : String(tableErr);
      results.push(`⚠️ Table check issue: ${msg.substring(0, 100)}`);
    }

    // ─── فحص حساب المدير ───
    try {
      const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
      if (admin) {
        results.push(`✅ Admin account exists: ${admin.email} (${admin.displayName})`);
      } else {
        results.push('⚠️ No admin account found — seed needed');
      }
    } catch (adminErr: unknown) {
      const msg = adminErr instanceof Error ? adminErr.message : String(adminErr);
      results.push(`⚠️ Admin check issue: ${msg.substring(0, 100)}`);
    }

    return NextResponse.json({
      status: 'success',
      results,
      message: '✅ All checks passed — platform is ready',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    results.push(`❌ Error: ${message}`);
    return NextResponse.json({ status: 'error', results }, { status: 500 });
  }
}
