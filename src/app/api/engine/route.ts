// ═══════════════════════════════════════════════════════════════════════
// API Route: تشغيل المحرك الموحد V3.0
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runEngine } from '@/lib/engine/orchestrator';
import type { EngineInput } from '@/lib/engine/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body: EngineInput = await request.json();

    // تحقق بسيط من وجود المدخلات الأساسية
    if (!body.penetration?.weaponId || !body.penetration?.soilTypeCode) {
      return NextResponse.json(
        { error: 'مدخلات غير مكتملة: يجب تحديد السلاح ونوع التربة' },
        { status: 400 }
      );
    }

    if (!body.blast?.radialDistance || body.blast.radialDistance <= 0) {
      return NextResponse.json(
        { error: 'مدخلات غير صالحة: يجب تحديد عمق السقف (قيمة موجبة)' },
        { status: 400 }
      );
    }

    if (
      !body.design?.tunnelSpanShort ||
      !body.design?.tunnelSpanLong ||
      !body.design?.fcMpa ||
      !body.design?.fyMpa
    ) {
      return NextResponse.json(
        { error: 'مدخلات التصميم غير مكتملة' },
        { status: 400 }
      );
    }

    const output = runEngine(body);

    return NextResponse.json(output);
  } catch (err) {
    console.error('[ENGINE API ERROR]', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'خطأ داخلي في المحرك',
      },
      { status: 500 }
    );
  }
}
