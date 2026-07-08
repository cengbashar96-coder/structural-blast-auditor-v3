// ═══════════════════════════════════════════════════════════════════════
// مكون مشترك — حالة "لم يتم الحساب بعد"
// منصة المدقق الديناميكي الموحد V3.1
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight } from 'lucide-react';

interface NoDataStateProps {
  title?: string;
  description?: string;
}

export function NoDataState({ title, description }: NoDataStateProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-950/20">
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Calculator className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-amber-300 font-bold text-lg">
            {title ?? 'لم يتم حساب النتائج بعد'}
          </h3>
          <p className="text-slate-500 text-sm max-w-md">
            {description ?? 'أدخل معطيات المشروع في صفحة المدخلات ثم اضغط "احسب" للحصول على النتائج'}
          </p>
        </div>
        <Link href="/dashboard/step2-inputs">
          <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
            <ArrowRight className="w-4 h-4 ml-1.5" />
            انتقل إلى صفحة المدخلات
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
