// ═══════════════════════════════════════════════════════════════════════
// API Route — توليد التقرير على مستوى الخادم
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/reporting/report-generator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const caseName = searchParams.get('case') || 'BMK-02';

    // بناء التقرير من القيم المرجعية المقفلة
    const reportData = ReportGenerator.buildReportData([], undefined, caseName);

    switch (format) {
      case 'json': {
        return NextResponse.json(reportData, {
          headers: {
            'Content-Disposition': `attachment; filename="audit-report-${Date.now()}.json"`,
          },
        });
      }
      case 'csv': {
        const csv = ReportGenerator.exportCSV(reportData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-report-${Date.now()}.csv"`,
          },
        });
      }
      case 'markdown': {
        const md = ReportGenerator.exportMarkdown(reportData);
        return new NextResponse(md, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-report-${Date.now()}.md"`,
          },
        });
      }
      default:
        return NextResponse.json(
          { error: 'صيغة غير مدعومة. استخدم: json, csv, markdown' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في توليد التقرير', details: String(error) },
      { status: 500 }
    );
  }
}
