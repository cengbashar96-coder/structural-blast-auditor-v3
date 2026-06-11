// ═══════════════════════════════════════════════════════════════════════
// Unified Export - المحركات الثلاثة + نظام التخزين الفرعي
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

// المحرك الأول: ثوابت Baseline والاستيفاء
export * from './baselineConstants';

// المحرك الثاني: محرك ضغوط العصف الديناميكي
export * from './blastEngine';

// المحرك الثالث: محرك التصميم الإنشائي والتحقق المزدوج
export * from './structuralSchema';
export * from './structuralEngine';

// ─── نظام التخزين الفرعي المتكامل (Storage Subsystem v2) ───
// الطبقة الجديدة: Repository Pattern + Zod Validation + Sync Queue
// للوصول المباشر من المكونات:
//   import { db, projectRepository, scenarioRepository } from '@/lib/storage';
export { db, projectRepository, scenarioRepository, rtmRepository, syncQueueRepository } from '../storage';
export type { ProjectRecord, ScenarioRecord, RtmRecord, SyncQueueRecord } from '../storage';
