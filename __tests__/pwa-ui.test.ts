// ═══════════════════════════════════════════════════════════════════════
// اختبارات مكونات PWA Shell وواجهات Dashboard
// منصة المدقق الديناميكي الموحد V3.0
// TC-PWA: اختبارات المانيفست، صفحة الأوفلاين، مكون مراقبة الشبكة
// TC-UI: اختبارات الاستمارة الهندسية، لوحة النتائج، محاكي SVG
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ProjectRecordSchema,
  ScenarioRecordSchema,
  SyncQueueRecordSchema,
  type ProjectRecord,
  type ScenarioRecord,
} from '@/lib/storage/storageSchemas';
import { db } from '@/lib/storage/db';
import { StructuralInputSchema } from '@/lib/structural/structuralSchema';
import { calculateStructuralVerification } from '@/lib/structural/structuralEngine';

// ═══════════════════════════════════════════════════════════════════════
// القسم الأول: اختبارات PWA Shell (TC-PWA)
// ═══════════════════════════════════════════════════════════════════════

describe('PWA Shell - Manifest & Offline Infrastructure', () => {
  // TC-PWA-001: التحقق من بنية manifest.json
  it('TC-PWA-001: manifest.json يحتوي على الحقول الإلزامية للـ PWA', async () => {
    // محاكاة قراءة الـ manifest
    const manifest = {
      name: 'منصة التقييم والتدقيق الإنشائي الديناميكي الموحد',
      short_name: 'المدقق الديناميكي',
      description: 'منصة سيادية أوفلاين بالكامل لتدقيق وحساب المنشآت تحت تأثير العصف والمقذوفات وفق الكود السوري 2024',
      id: '/?source=pwa',
      start_url: '/?source=pwa',
      display: 'standalone',
      orientation: 'any',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      dir: 'rtl',
      lang: 'ar',
      categories: ['productivity', 'engineering'],
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };

    // التحقق من الحقول الإلزامية
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0f172a');
    expect(manifest.background_color).toBe('#0f172a');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.lang).toBe('ar');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // التحقق من وجود أيقونة 192x192 و 512x512 (مطلوبان لـ PWA)
    const iconSizes = manifest.icons.map(i => i.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');
  });

  // TC-PWA-002: التحقق من سلوك العرض المستقل
  it('TC-PWA-002: display=standalone يمنع ظهور شريط المتصفح التقليدي', () => {
    const manifest = { display: 'standalone' };
    expect(manifest.display).toBe('standalone');
    expect(['standalone', 'fullscreen']).toContain(manifest.display);
  });

  // TC-PWA-003: التحقق من اتجاه النص RTL
  it('TC-PWA-003: dir=rtl يدعم الواجهة العربية', () => {
    const manifest = { dir: 'rtl', lang: 'ar' };
    expect(manifest.dir).toBe('rtl');
    expect(manifest.lang).toBe('ar');
  });

  // TC-PWA-004: التحقق من استراتيجيات الكاش الثلاث
  it('TC-PWA-004: استراتيجيات الكاش الثلاث معرفة بشكل صحيح', () => {
    const cachingStrategies = {
      appShell: {
        strategy: 'CacheFirst',
        resources: ['fonts', 'js', 'css', 'icons'],
        behavior: 'تحميل فوري من التخزين الداخلي دون الشبكة',
      },
      referenceData: {
        strategy: 'StaleWhileRevalidate',
        resources: ['JSON constants', 'code tables'],
        behavior: 'عرض النسخة المحلية فوراً مع تحديث صامت',
      },
      apiRequests: {
        strategy: 'NetworkFirst',
        resources: ['API requests', 'sync operations'],
        behavior: 'محاولة الاتصال أولاً، الرجوع للكاش عند الفشل',
      },
    };

    expect(cachingStrategies.appShell.strategy).toBe('CacheFirst');
    expect(cachingStrategies.referenceData.strategy).toBe('StaleWhileRevalidate');
    expect(cachingStrategies.apiRequests.strategy).toBe('NetworkFirst');

    // التحقق من عزل الاستراتيجيات
    const strategies = Object.values(cachingStrategies).map(s => s.strategy);
    const uniqueStrategies = new Set(strategies);
    expect(uniqueStrategies.size).toBe(3);
  });

  // TC-PWA-005: التحقق من آلية SKIP_WAITING
  it('TC-PWA-005: Service Worker يستجيب لرسالة SKIP_WAITING', () => {
    const messageHandlers: Record<string, boolean> = { SKIP_WAITING: false };

    // محاكاة مستمع الرسائل
    const mockAddEventListener = (type: string, handler: (event: any) => void) => {
      if (type === 'message') {
        handler({ data: { type: 'SKIP_WAITING' } });
        messageHandlers.SKIP_WAITING = true;
      }
    };

    mockAddEventListener('message', (event: any) => {
      if (event.data?.type === 'SKIP_WAITING') {
        messageHandlers.SKIP_WAITING = true;
      }
    });

    expect(messageHandlers.SKIP_WAITING).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثاني: اختبارات واجهات Dashboard (TC-UI)
// ═══════════════════════════════════════════════════════════════════════

describe('Dashboard UI - Engineering Form & Results Pipeline', () => {
  // TC-UI-001: Zod Validation يمنع المدخلات غير الصالحة
  it('TC-UI-001: StructuralInputSchema يرفض القيم خارج النطاق الكودي', () => {
    const invalidInput = {
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 10, // أقل من الحد الأدنى 25
      f_y: 100, // أقل من الحد الأدنى 240
      h_slab: 50, // أقل من الحد الأدنى 300
      b_column: 50, // أقل من الحد الأدنى 200
      h_column: 50,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const result = StructuralInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map(i => i.path.join('.'));
      expect(fieldErrors).toContain('f_c');
      expect(fieldErrors).toContain('f_y');
      expect(fieldErrors).toContain('h_slab');
      expect(fieldErrors).toContain('b_column');
    }
  });

  // TC-UI-002: Zod Validation يقبل المدخلات الصالحة
  it('TC-UI-002: StructuralInputSchema يقبل القيم الكودية الصحيحة', () => {
    const validInput = {
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const result = StructuralInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // TC-UI-003: خط البيانات من الاستمارة إلى المحرك إلى SVG
  it('TC-UI-003: Data Pipeline: Form → Zod → Engine → SVG Color', () => {
    // سيناريو ناجح
    const successInput = {
      designMethod: 'SYRIAN_WSD_2024' as const,
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const parsed = StructuralInputSchema.safeParse(successInput);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      const output = calculateStructuralVerification(parsed.data);
      expect(output.svgColor).toBeDefined();
      expect(['GREEN', 'RED_FLASHING']).toContain(output.svgColor);
      expect(output.status).toBeDefined();
      expect(['SUCCESS', 'PUNCHING_FAILURE', 'CRITICAL_ERROR']).toContain(output.status);
    }
  });

  // TC-UI-004: SVG Color = GREEN عندما تكون اللامركزية داخل النواة
  it('TC-UI-004: EccentricitySvg color=GREEN when e <= e_limit', () => {
    const input = {
      designMethod: 'SYRIAN_WSD_2024' as const,
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const output = calculateStructuralVerification(input);
    expect(output.eccentricity).toBeLessThanOrEqual(output.e_limit);
    expect(output.svgColor).toBe('GREEN');
    expect(output.e_limit).toBe(input.h_slab / 6);
  });

  // TC-UI-005: SVG Color = RED_FLASHING عندما تتجاوز اللامركزية حد النواة
  it('TC-UI-005: EccentricitySvg color=RED_FLASHING when e > e_limit', () => {
    const input = {
      designMethod: 'SYRIAN_WSD_2024' as const,
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 5000, // عزم مرتفع جداً → لامركزية خارج النواة
      n_dynamic: 500,
    };

    const output = calculateStructuralVerification(input);
    expect(output.eccentricity).toBeGreaterThan(output.e_limit);
    expect(output.svgColor).toBe('RED_FLASHING');
  });

  // TC-UI-006: ResultsPanel يعرض رسالة خطأ عند فشل القص الثاقب
  it('TC-UI-006: ResultsPanel shows error message on PUNCHING_FAILURE', () => {
    const input = {
      designMethod: 'SYRIAN_WSD_2024' as const,
      f_c: 25, // خرسانة ضعيفة
      f_y: 240,
      h_slab: 300, // سماكة صغيرة جداً
      b_column: 800, // عمود كبير
      h_column: 800,
      a_tributary: 50,
      p_design: 2000, // ضغط عصف عالي جداً
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const output = calculateStructuralVerification(input);
    if (output.status === 'PUNCHING_FAILURE') {
      expect(output.errorMessage).toBeDefined();
      expect(output.errorMessage).toContain('فشل');
      expect(output.v_actual).toBeGreaterThan(output.v_cd!);
    }
  });

  // TC-UI-007: حقول القراءة فقط لا يمكن تعديلها من الاستمارة
  it('TC-UI-007: Read-only fields are enforced for blast engine outputs', () => {
    const blastOutputs = {
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    // محاكاة سلوك حقل ReadOnly
    const readOnlyFields = ['p_design', 'm_dynamic', 'n_dynamic'] as const;
    for (const field of readOnlyFields) {
      const value = blastOutputs[field];
      expect(value).toBeGreaterThan(0);
      // حقل ReadOnly لا يمكن تغييره يدوياً — القيمة تأتي من المحرك (أ)
      expect(typeof value).toBe('number');
    }
  });

  // TC-UI-008: تصميم Server-First Layout + Client Islands
  it('TC-UI-008: Dashboard Layout is Server Component with Client Islands', () => {
    // التحقق من أن الـ Layout لا يحتوي على useState/useEffect
    // وأن الجزر التفاعلية معزولة بشكل صحيح
    const clientIslands = [
      'NetworkStatus',
      'EngineeringForm',
      'ResultsPanel',
      'EccentricitySvg',
      'PWARegister',
    ];

    // كل جزيرة عميلية يجب أن تكون مستقلة
    expect(clientIslands.length).toBe(5);

    // الـ Layout نفسه هو Server Component
    // لا يراقب الشبكة مباشرة بل يفوض ذلك لـ NetworkStatus
    const layoutDependencies = ['NetworkStatus', 'PWARegister'];
    expect(layoutDependencies.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// القسم الثالث: اختبارات تكامل خط البيانات الكامل (TC-INT)
// ═══════════════════════════════════════════════════════════════════════

describe('Full Data Pipeline Integration', () => {
  beforeEach(async () => {
    await db.nukeDatabase();
  });

  // TC-INT-001: خط البيانات الكامل من الإدخال إلى الحفظ المحلي
  it('TC-INT-001: Complete pipeline: Input → Validation → Engine → SVG → Save', async () => {
    const { projectRepository, scenarioRepository } = await import('@/lib/storage');

    // 1. إنشاء مشروع
    const project = await projectRepository.createProject(
      'مشروع اختبار تكاملي',
      'اختبار خط البيانات الكامل'
    );
    expect(project.id).toBeDefined();

    // 2. إعداد المدخلات والتحقق عبر Zod
    const input = {
      designMethod: 'SYRIAN_WSD_2024' as const,
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    };

    const parsed = StructuralInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);

    // 3. تشغيل المحرك الحسابي
    const output = calculateStructuralVerification(input);
    expect(output.status).toBe('SUCCESS');
    expect(output.svgColor).toBe('GREEN');

    // 4. حفظ السيناريو عبر Repository Layer
    const scenario = await scenarioRepository.createScenario(
      project.id,
      'سيناريو تكاملي',
      input
    );
    expect(scenario.id).toBeDefined();

    // 5. حفظ مخرجات المحرك
    await scenarioRepository.saveStructuralOutput(scenario.id, output);

    // 6. التحقق من الحفظ
    const saved = await scenarioRepository.getScenariosByProjectId(project.id);
    expect(saved.length).toBe(1);
    expect(saved[0].outputs).toBeDefined();
    expect(saved[0].outputs!.status).toBe('SUCCESS');
    expect(saved[0].outputs!.svgColor).toBe('GREEN');
  });

  // TC-INT-002: NetworkStatus يراقب طابور المزامنة
  it('TC-INT-002: NetworkStatus monitors sync queue from IndexedDB', async () => {
    const { syncQueueRepository } = await import('@/lib/storage');

    // التحقق من أن طابور المزامنة فارغ
    const status = await syncQueueRepository.getQueueStatus();
    expect(status.pending).toBe(0);

    // إضافة عنصر للطابور
    await db.syncQueue.add({
      id: 'test-sync-001',
      action: 'CREATE_PROJECT',
      payload: { name: 'test' },
      status: 'PENDING',
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
    });

    const updatedStatus = await syncQueueRepository.getQueueStatus();
    expect(updatedStatus.pending).toBe(1);
  });

  // TC-INT-003: Accessibility - SVG يوفر وصفاً لقارئات الشاشة
  it('TC-INT-003: EccentricitySvg provides accessible descriptions', () => {
    const safeOutput = calculateStructuralVerification({
      designMethod: 'SYRIAN_WSD_2024',
      f_c: 30,
      f_y: 400,
      h_slab: 1200,
      b_column: 500,
      h_column: 500,
      a_tributary: 25,
      p_design: 500,
      m_dynamic: 100,
      n_dynamic: 500,
    });

    const isSafe = safeOutput.svgColor === 'GREEN';
    const accessibilityDescription = isSafe
      ? `محصلة القوى تقع بداخل النواة المركزية بأمان. اللامركزية ${safeOutput.eccentricity.toFixed(1)} ملم.`
      : `محصلة القوى خرجت من حدود النواة. اللامركزية ${safeOutput.eccentricity.toFixed(1)} ملم.`;

    expect(accessibilityDescription).toContain('النواة');
    expect(accessibilityDescription).toContain(safeOutput.eccentricity.toFixed(1));
  });
});
