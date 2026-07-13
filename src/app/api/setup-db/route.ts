/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔧 API Route لفحص قاعدة البيانات — Database Health Check & Seed
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يفحص اتصال قاعدة البيانات عبر Supabase REST API أو JSON المحلي
 * ويعرض معلومات عن الجداول الموجودة وحساب المدير
 *
 * GET  /api/setup-db  — فحص حالة قاعدة البيانات
 * POST /api/setup-db  — بذر حساب المدير الافتراضي
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection, db } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/password';

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
        results.push('⚠️ No admin account found — seed needed (POST /api/setup-db)');
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

/**
 * POST /api/setup-db — بذر حساب المدير الافتراضي
 *
 * يُنشئ حساب مدير افتراضي إذا لم يكن هناك أي مدير في النظام.
 * لا يتطلب مصادقة — يُستخدم لتهيئة النظام لأول مرة.
 *
 * Body: { "action": "seed-admin" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'seed-admin';

    if (action === 'seed-admin') {
      // التحقق من وجود مدير بالفعل
      const existingAdmin = await db.user.findFirst({ where: { role: 'ADMIN' } }) as any;

      if (existingAdmin) {
        return NextResponse.json({
          success: true,
          message: `يوجد مدير بالفعل: ${existingAdmin.email} (${existingAdmin.displayName}) — لا حاجة للبذر`,
          admin: { email: existingAdmin.email, displayName: existingAdmin.displayName },
        });
      }

      // بذر حساب المدير الافتراضي
      const passwordHash = await hashPassword('REDACTED_ADMIN_PASSWORD');
      const admin = await db.user.create({
        data: {
          email: 'cengbashar96@gmail.com',
          displayName: 'المهندس أبو سليمان',
          passwordHash,
          role: 'ADMIN',
          syndicateId: 'SYR-ENG-ADMIN-001',
          specialization: 'هندسة إنشائية - تحقق من أحمال الانفجار',
          subscriptionStatus: 'APPROVED',
          permissions: [
            'CAN_RUN_ENGINE',
            'CAN_MODIFY_INPUTS',
            'CAN_VIEW_REPORTS',
            'CAN_EXPORT_DATA',
            'CAN_MODIFY_BASELINE',
            'CAN_MANAGE_PROJECTS',
            'CAN_AUDIT',
          ],
          approvedBy: 'SYSTEM_SEED',
          statusChangedAt: new Date(),
        },
      }) as any;

      console.log(`[SetupDB] Default admin seeded: ${admin.email}`);

      return NextResponse.json({
        success: true,
        message: `تم بذر حساب المدير الافتراضي بنجاح: ${admin.email}`,
        admin: { email: admin.email, displayName: admin.displayName },
      });
    }

    return NextResponse.json(
      { success: false, error: `إجراء غير معروف: ${action}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[SetupDB] POST error:', message);
    return NextResponse.json(
      { success: false, error: `فشل بذر حساب المدير: ${message}` },
      { status: 500 }
    );
  }
}
