/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔌 عميل قاعدة البيانات الموحد — Unified Database Client
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يوفر تبديلاً تلقائياً بين Supabase REST API و JSON المحلي:
 *   - إذا كانت متغيرات Supabase متاحة AND الاتصال يعمل → Supabase
 *   - خلاف ذلك → JSON المحلي (أوفلاين)
 *
 * ⚠️ يمكن إجبار الوضع الأوفلاين عبر متغير البيئة:
 *    FORCE_OFFLINE=true
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 🔍 تحديد وضع قاعدة البيانات
// ═══════════════════════════════════════════════════════════════════════

type DbMode = 'supabase' | 'local';

function determineDbMode(): DbMode {
  if (process.env.FORCE_OFFLINE === 'true') {
    console.log('[UnifiedDB] FORCE_OFFLINE=true — using local JSON database');
    return 'local';
  }

  const hasSupabaseUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasSupabaseKey = !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY);

  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.log('[UnifiedDB] Supabase credentials not found — using local JSON database');
    return 'local';
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV !== 'production') {
    console.log('[UnifiedDB] Development mode without NEXT_PUBLIC_SUPABASE_URL — using local JSON database');
    return 'local';
  }

  console.log('[UnifiedDB] Supabase credentials available — using Supabase REST API');
  return 'supabase';
}

// ═══════════════════════════════════════════════════════════════════════
// 🗄️ واجهة Delegate الموحدة
// ═══════════════════════════════════════════════════════════════════════

export interface UnifiedDelegate {
  findUnique(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown | null>;
  findFirst(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    select?: Record<string, boolean>;
  }): Promise<unknown | null>;
  findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
    select?: Record<string, boolean>;
  }): Promise<unknown[]>;
  create(args: { data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown>;
  delete(args: { where: Record<string, unknown> }): Promise<unknown>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ عميل قاعدة البيانات الموحد
// ═══════════════════════════════════════════════════════════════════════

class UnifiedPrismaClient {
  public readonly user: UnifiedDelegate;
  public readonly project: UnifiedDelegate;
  public readonly scenario: UnifiedDelegate;
  public readonly rtmRecord: UnifiedDelegate;
  public readonly auditLog: UnifiedDelegate;
  public readonly processedEvent: UnifiedDelegate;

  public readonly mode: DbMode;

  constructor() {
    this.mode = determineDbMode();

    if (this.mode === 'local') {
      const { localDb } = require('./json-adapter');
      this.user = localDb.user;
      this.project = localDb.project;
      this.scenario = localDb.scenario;
      this.rtmRecord = localDb.rtmRecord;
      this.auditLog = localDb.auditLog;
      this.processedEvent = localDb.processedEvent;
    } else {
      try {
        const { supabaseDb } = require('./supabase-adapter');
        this.user = supabaseDb.user;
        this.project = supabaseDb.project;
        this.scenario = supabaseDb.scenario;
        this.rtmRecord = supabaseDb.rtmRecord;
        this.auditLog = supabaseDb.auditLog;
        this.processedEvent = supabaseDb.processedEvent;
      } catch (error) {
        console.error('[UnifiedDB] Failed to initialize Supabase — falling back to local JSON:', error);
        const { localDb } = require('./json-adapter');
        this.user = localDb.user;
        this.project = localDb.project;
        this.scenario = localDb.scenario;
        this.rtmRecord = localDb.rtmRecord;
        this.auditLog = localDb.auditLog;
        this.processedEvent = localDb.processedEvent;
      }
    }
  }

  async $connect(): Promise<void> {
    console.log(`[UnifiedDB] Connected in ${this.mode} mode`);
  }

  async $disconnect(): Promise<void> {}

  async $executeRaw(): Promise<never> {
    throw new Error('[UnifiedDB] $executeRaw is not supported');
  }

  async $queryRaw(): Promise<never> {
    throw new Error('[UnifiedDB] $queryRaw is not supported');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🔍 فحص الاتصال
// ═══════════════════════════════════════════════════════════════════════

export async function checkDatabaseConnection(): Promise<{ ok: boolean; method: string; error?: string }> {
  const mode = getUnifiedDb().mode;
  const method = mode === 'local' ? 'JSON Local (offline)' : 'Supabase REST API';
  try {
    await getUnifiedDb().user.count({});
    return { ok: true, method };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, method, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 تصدير
// ═══════════════════════════════════════════════════════════════════════

let _unifiedInstance: UnifiedPrismaClient | null = null;

function getUnifiedDb(): UnifiedPrismaClient {
  if (_unifiedInstance) return _unifiedInstance;
  _unifiedInstance = new UnifiedPrismaClient();
  return _unifiedInstance;
}

export const unifiedDb = getUnifiedDb();
export const prisma = unifiedDb;
export const db = unifiedDb;
export default unifiedDb;
