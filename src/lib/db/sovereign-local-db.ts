/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🏗️ قاعدة البيانات المحلية السيادية — Sovereign Local Database
 * ═══════════════════════════════════════════════════════════════════════
 *
 * كلاس قاعدة بيانات يرث من Dexie لتحديد المخطط المحلي (Dexie Schema)
 * للبيانات الحسابية والهندسية مع:
 *
 *   ١. جدول طابور مزامنة سيادي (sync_queue) بحقول موسّعة:
 *      - contextId: معرف السياق التنفيذي (من id-utility.ts نمط CTX)
 *      - eventId: معرف الحدث التدقيقي (من id-utility.ts نمط EVT)
 *      - action: نوع العملية
 *      - payload: بيانات العملية
 *      - payloadHash: بصمة SHA-256 للتأكد من التكردر (Idempotency)
 *      - status: حالة المزامنة (PENDING | SYNCING | COMPLETED | FAILED)
 *      - retries: عدد محاولات الإعادة
 *      - timestamp: لحظة الإنشاء
 *
 *   ٢. دالة ملحقة لحساب البصمة الرقمية (SHA-256) تعتمد على
 *      ترتيب مفاتيح الـ JSON بشكل تكراري وعميق
 *      (Recursive Canonical Serialization) لضمان ثبات الـ Hash
 *      للمدخلات المتطابقة أياً كان ترتيبها ومنع تكرار الإرسال.
 *
 * ⚠️ هذه الوحدة تعمل في المتصفح فقط (Client-Side)
 *    لأنها تعتمد على IndexedDB عبر Dexie
 * ═══════════════════════════════════════════════════════════════════════
 */

import Dexie, { type Table } from 'dexie';

// ═══════════════════════════════════════════════════════════════════════
// 📐 عقود TypeScript — أنواع طابور المزامنة السيادي
// ═══════════════════════════════════════════════════════════════════════

/** حالة سجل المزامنة — دورة حياة كاملة */
export type SyncQueueStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';

/** سجل طابور المزامنة السيادي — مخطط موسّع عن النسخة الأساسية */
export interface SovereignSyncQueueRecord {
  /** المفتاح الأساسي — يُولَّد تلقائياً */
  id?: number;
  /** معرف السياق التنفيذي (نمط CTX) — يربط العملية بسلسلة التنفيذ */
  contextId: string;
  /** معرف الحدث التدقيقي (نمط EVT) — يربط العملية بسجل التدقيق */
  eventId: string;
  /** نوع العملية — CREATE / UPDATE / DELETE / LOG_RTM وغيرها */
  action: string;
  /** بيانات العملية — الحمولة المراد مزامنتها */
  payload: Record<string, unknown>;
  /** بصمة SHA-256 للحمولة — لمنع تكرار الإرسال (Idempotency Guard) */
  payloadHash: string;
  /** حالة المزامنة الحالية */
  status: SyncQueueStatus;
  /** عدد محاولات الإعادة — يزداد عند كل فشل */
  retries: number;
  /** لحظة إنشاء السجل — تُستخدم للترتيب الزمني FIFO */
  timestamp: number;
  /** رسالة الخطأ الأخيرة — اختيارية */
  lastError?: string;
}

/** سجل المشروع الهندسي — مطابق للنسخة الأساسية مع حقول إضافية */
export interface LocalProjectRecord {
  id: string;
  name: string;
  description?: string;
  baselineVersion: string;
  createdAt: number;
  updatedAt: number;
}

/** سجل السيناريو الحسابي — المدخلات والمخرجات الإنشائية */
export interface LocalScenarioRecord {
  id: string;
  projectId: string;
  title: string;
  inputs: Record<string, unknown>;
  outputs?: {
    status: 'SUCCESS' | 'PUNCHING_FAILURE' | 'CRITICAL_ERROR';
    d_eff: number;
    b_0: number;
    eccentricity: number;
    e_limit: number;
    svgColor: 'GREEN' | 'RED_FLASHING';
    rho_final: number;
    v_actual?: number;
    v_cd?: number;
    calculatedAt: number;
    errorMessage?: string;
  };
  createdAt: number;
  updatedAt: number;
}

/** سجل RTM — تتبع المتطلبات والعيوب */
export interface LocalRtmRecord {
  id: string;
  scenarioId: string;
  testCaseId: string;
  associatedRequirement: string;
  status: 'PASSED' | 'FAILED';
  defectLog?: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 🔐 البصمة الرقمية — SHA-256 Canonical Serialization
// ═══════════════════════════════════════════════════════════════════════

/**
 * التسلسل الكنوني التكراري العميق — Recursive Canonical Serialization
 *
 * يُحوّل أي كائن JavaScript إلى سلسلة JSON ذات ترتيب مفاتيح ثابت
 * ومتكرر وعميق (أي الكائنات المتداخلة تُرتَّب مفاتيحها أيضاً).
 *
 * هذا يضمن أن الكائنين التاليين ينتجان نفس الـ Hash:
 *
 *   { b: 2, a: 1 }  ←→  { a: 1, b: 2 }  → نفس الـ Hash ✅
 *   { x: { c: 3, b: 2 }, a: 1 }
 *     ←→
 *   { a: 1, x: { b: 2, c: 3 } }  → نفس الـ Hash ✅
 *
 * القواعد:
 *   ١. مفاتيح الكائنات تُرتَّب أبجدياً بشكل تكراري
 *   ٢. المصفوفات تحافظ على ترتيبها (لا تُرتَّب)
 *   ٣. القيم البدائية (string, number, boolean, null) تُحفظ كما هي
 *   ٤. undefined تُستبدل بـ null للاتساق
 *   ٥. التواريخ تُحوَّل إلى أرقام (timestamp)
 */
export function canonicalSerialize(value: unknown): string {
  // القيم البدائية
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return JSON.stringify(value);

  // التواريخ — تحويل إلى timestamp رقمي
  if (value instanceof Date) {
    return value.getTime().toString();
  }

  // المصفوفات — ترتيب العناصر محفوظ (لا نُرتّب المصفوفات)
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalSerialize(item));
    return `[${items.join(',')}]`;
  }

  // الكائنات — ترتيب أبجدي تكراري عميق للمفاتيح
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();

    const pairs = sortedKeys.map((key) => {
      const serializedKey = JSON.stringify(key);
      const serializedValue = canonicalSerialize(obj[key]);
      return `${serializedKey}:${serializedValue}`;
    });

    return `{${pairs.join(',')}}`;
  }

  // أنواع أخرى — تحويل إلى سلسلة
  return String(value);
}

/**
 * حساب بصمة SHA-256 للحمولة — Idempotency Guard
 *
 * يستخدم التسلسل الكنوني لضمان ثبات الـ Hash مهما كان ترتيب
 * المفاتيح في الكائن الأصلي. هذا يمنع تكرار إرسال نفس البيانات
 * بترتيب مختلف (Idempotency).
 *
 * ⚠️ يستخدم Web Crypto API (SubtleCrypto) المتاح في المتصفحات
 *    الحديثة وأيضاً في Node.js 18+
 *
 * @param payload - الحمولة المراد حساب بصمتها
 * @returns بصمة SHA-256 بصيغة سداسية عشرية (64 حرف)
 */
export async function computePayloadHash(payload: Record<string, unknown>): Promise<string> {
  // ١. تسلسل كنوني — ترتيب مفاتيح ثابت ومتكرر
  const canonical = canonicalSerialize(payload);

  // ٢. تحويل إلى بايتات UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  // ٣. حساب SHA-256 عبر Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // ٤. تحويل إلى سلسلة سداسية عشرية
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * حساب بصمة SHA-256 متزامن (للحالات التي لا تدعم async)
 *
 * ⚠️ يُستخدم فقط عندما يكون SubtleCrypto غير متاح.
 *    يُنتج نتيجة أقل دقة (ليس SHA-256 حقيقي) — استخدم computePayloadHash
 *    بدلاً منه عندما يكون async ممكناً.
 *
 * @param payload - الحمولة المراد حساب بصمتها
 * @returns بصمة بديلة بصيغة سداسية عشرية
 */
export function computePayloadHashSync(payload: Record<string, unknown>): string {
  const canonical = canonicalSerialize(payload);

  // خوارزمية تجزئة بسيطة (djb2) — بديل متزامن عندما لا يكون SubtleCrypto متاحاً
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash + canonical.charCodeAt(i)) & 0xffffffff;
  }

  // تحويل إلى سداسي عشري مع حشو
  const part1 = ((hash >>> 0).toString(16).padStart(8, '0'));
  // تجزئة ثانوية لتقليل التصادمات
  let hash2 = 5271;
  for (let i = canonical.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) + hash2 + canonical.charCodeAt(i)) & 0xffffffff;
  }
  const part2 = ((hash2 >>> 0).toString(16).padStart(8, '0'));

  // تكرار النمط ليقارب طول SHA-256 (64 حرف)
  const base = part1 + part2;
  return base.repeat(4).slice(0, 64);
}

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ كلاس قاعدة البيانات السيادية — SovereignLocalDB
// ═══════════════════════════════════════════════════════════════════════

/**
 * SovereignLocalDB — قاعدة البيانات المحلية المعزولة السيادية
 *
 * تمتد من Dexie وتعرّف المخطط المحكم لجميع جداول البيانات
 * الهندسية والحسابية مع طابور مزامنة سيادي موسّع.
 *
 * مبادئ التصميم:
 * ──────────────────
 * ١. كل جدول مفهرس بحقول البحث الحرجة فقط
 * ٢. طابور المزامنة يحتوي على بصمة SHA-256 لمنع التكرار
 * ٣. Versioning مقفل: أي تعديل يستدعي version() جديد
 * ٤. عزل كامل: لا وصول مباشر من الـ UI — فقط عبر Repository + Adapter
 */
export class SovereignLocalDB extends Dexie {
  // ─── جداول البيانات الهندسية ───

  /** مشاريع التدقيق الإنشائي */
  projects!: Table<LocalProjectRecord, string>;

  /** سيناريوهات التصميم والنتائج الحسابية */
  scenarios!: Table<LocalScenarioRecord, string>;

  /** سجلات تتبع المتطلبات (RTM Ledger) */
  rtmRecords!: Table<LocalRtmRecord, string>;

  /** طابور المزامنة السيادي — مخطط موسّع مع contextId/eventId/payloadHash */
  syncQueue!: Table<SovereignSyncQueueRecord, number>;

  constructor() {
    super('SovereignLocalDB');

    // ─── الإصدار الأول: البنية الأساسية المقفلة (Locked Schema v1) ───
    //
    // فهارس البحث الحاكمة:
    //   projects   → id (PK), baselineVersion (فلترة), createdAt (ترتيب)
    //   scenarios  → id (PK), projectId (ربط بالمشروع), createdAt (ترتيب)
    //   rtmRecords → id (PK), scenarioId, testCaseId, status (فلترة)
    //   syncQueue  → ++id (PK تلقائي), contextId, status (مراقبة),
    //                payloadHash (منع التكرار), timestamp (ترتيب FIFO)
    this.version(1).stores({
      projects: 'id, baselineVersion, createdAt',
      scenarios: 'id, projectId, createdAt',
      rtmRecords: 'id, scenarioId, testCaseId, status',
      syncQueue: '++id, contextId, eventId, action, status, payloadHash, timestamp',
    });
  }

  /**
   * التحقق من تكرار الحمولة — Idempotency Guard
   *
   * يفحص ما إذا كانت حمولة بنفس البصمة (SHA-256) موجودة مسبقاً
   * في طابور المزامنة بحالة PENDING أو SYNCING، مما يمنع
   * إرسال نفس البيانات مرتين حتى لو اختلف ترتيب المفاتيح.
   *
   * @param hash - بصمة SHA-256 للحمولة
   * @returns true إذا وُجد تكرار (يجب تجاهل الإرسال)
   */
  async isDuplicatePayload(hash: string): Promise<boolean> {
    const count = await this.syncQueue
      .where('payloadHash')
      .equals(hash)
      .filter((record) => record.status === 'PENDING' || record.status === 'SYNCING')
      .count();
    return count > 0;
  }

  /**
   * إضافة حدث إلى طابور المزامنة السيادي
   *
   * التدفق:
   *   ١. حساب بصمة SHA-256 للحمولة (Idempotency Guard)
   *   ٢. التحقق من عدم وجود تكرار
   *   ٣. إدراج السجل في طابور المزامنة
   *
   * @param event - بيانات الحدث بدون id و payloadHash (تُولَّد تلقائياً)
   * @returns بصمة الحمولة المحسوبة
   */
  async enqueueSyncEvent(event: {
    contextId: string;
    eventId: string;
    action: string;
    payload: Record<string, unknown>;
  }): Promise<string> {
    // ١. حساب البصمة الرقمية
    const payloadHash = await computePayloadHash(event.payload);

    // ٢. التحقق من التكرار — منع الإرسال المزدوج
    if (await this.isDuplicatePayload(payloadHash)) {
      console.warn(
        `[SovereignDB] ⚠️ حمولة مكررة (${payloadHash.slice(0, 12)}...) — ` +
        `تم تجاهل الإرسال لضمان الـ Idempotency.`
      );
      return payloadHash;
    }

    // ٣. إدراج في طابور المزامنة
    await this.syncQueue.add({
      contextId: event.contextId,
      eventId: event.eventId,
      action: event.action,
      payload: event.payload,
      payloadHash,
      status: 'PENDING',
      retries: 0,
      timestamp: Date.now(),
    });

    return payloadHash;
  }

  /**
   * إضافة دفعة من الأحداث إلى طابور المزامنة
   *
   * يستخدم transaction لضمان_atomicity: إما كل الأحداث تُضاف أو لا شيء.
   *
   * @param events - مصفوفة الأحداث المراد إضافتها
   * @returns مصفوفة بصمات الحمولات المحسوبة
   */
  async enqueueBatch(events: Array<{
    contextId: string;
    eventId: string;
    action: string;
    payload: Record<string, unknown>;
  }>): Promise<string[]> {
    const hashes: string[] = [];

    await this.transaction('rw', this.syncQueue, async () => {
      for (const event of events) {
        const payloadHash = await computePayloadHash(event.payload);

        // تجاهل التكرار بصمت — لا نُفشل العملية بأكملها
        if (!(await this.isDuplicatePayload(payloadHash))) {
          await this.syncQueue.add({
            contextId: event.contextId,
            eventId: event.eventId,
            action: event.action,
            payload: event.payload,
            payloadHash,
            status: 'PENDING',
            retries: 0,
            timestamp: Date.now(),
          });
        }

        hashes.push(payloadHash);
      }
    });

    return hashes;
  }

  /**
   * إحصائيات قاعدة البيانات — للمراقبة والتشخيص
   */
  async getStats(): Promise<{
    projects: number;
    scenarios: number;
    rtmRecords: number;
    syncQueue: {
      pending: number;
      syncing: number;
      completed: number;
      failed: number;
      total: number;
    };
  }> {
    const [projects, scenarios, rtmRecords] = await Promise.all([
      this.projects.count(),
      this.scenarios.count(),
      this.rtmRecords.count(),
    ]);

    const [pending, syncing, completed, failed] = await Promise.all([
      this.syncQueue.where('status').equals('PENDING').count(),
      this.syncQueue.where('status').equals('SYNCING').count(),
      this.syncQueue.where('status').equals('COMPLETED').count(),
      this.syncQueue.where('status').equals('FAILED').count(),
    ]);

    return {
      projects,
      scenarios,
      rtmRecords,
      syncQueue: {
        pending,
        syncing,
        completed,
        failed,
        total: pending + syncing + completed + failed,
      },
    };
  }

  /**
   * مسح كامل لقاعدة البيانات — للاستخدام في وضع التطوير فقط
   * ⚠️ يحذف جميع البيانات المحلية نهائياً
   */
  async nukeDatabase(): Promise<void> {
    await this.transaction(
      'rw',
      [this.projects, this.scenarios, this.rtmRecords, this.syncQueue],
      async () => {
        await this.projects.clear();
        await this.scenarios.clear();
        await this.rtmRecords.clear();
        await this.syncQueue.clear();
      }
    );
  }
}

// ─── Singleton Instance — نقطة الدخول الوحيدة لقاعدة البيانات السيادية ───
export const sovereignDB = new SovereignLocalDB();
