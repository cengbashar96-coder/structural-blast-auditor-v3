/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🧱 وحدة المعرفات الرقمية السيادية — Sovereign ID Utility
 * ═══════════════════════════════════════════════════════════════════════
 *
 * توليد معرفات ثابتة الصيغة باستخدام randomBytes وبصمة زمنية متسلسلة (base36).
 * يضمن تفرد كل معرف عبر دمج العشوائية المشفرة مع التسلسل الزمني.
 *
 * أنماط المعرفات:
 *   CTX — سياق تنفيذي (Context)     → يُستخدم لتتبع العمليات المركبة
 *   EVT — حدث تدقيق (Event)          → يُستخدم في سجل التدقيق الجنائي
 *   SSN — جلسة خادومية (Session)     → يُستخدم في إدارة الجلسات الآمنة
 *
 * ⚠️ هذه الوحدة تعمل حصرياً على الخادم (Server-Side Only)
 *    لأنها تعتمد على crypto.randomBytes المتاح فقط في بيئة Node.js
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomBytes } from 'node:crypto';

/** أنماط المعرفات السيادية المسموحة */
export type SovereignIdPrefix = 'CTX' | 'EVT' | 'SSN';

/** طلب عشوائي مشفر بطول 8 بايت (16 حرف سداسي عشري) */
const RANDOM_BYTES_LENGTH = 8;

/** طابع زمني بصيغة base36 (أقصى دقة: مللي ثانية) */
function getTimestampBase36(): string {
  return Date.now().toString(36).toUpperCase();
}

/** توليد جزء عشوائي مشفر بصيغة سداسية عشرية كبيرة */
function getRandomHex(): string {
  return randomBytes(RANDOM_BYTES_LENGTH).toString('hex').toUpperCase();
}

/**
 * توليد معرف سيادي ثابت الصيغة
 *
 * الصيغة: {PREFIX}-{TIMESTAMP_BASE36}-{RANDOM_HEX}
 * مثال:  CTX-M3Q7X9K-R4A1F8B2C3D5E7F9
 *
 * @param prefix - نمط المعرف (CTX | EVT | SSN)
 * @returns معرف سيادي فريد ومشفر زمنياً
 *
 * @example
 * generateSovereignId('CTX') // → "CTX-M3Q7X9K-R4A1F8B2C3D5E7F9"
 * generateSovereignId('EVT') // → "EVT-N8P2Y4L-A1B3C5D7E9F0A2B4"
 * generateSovereignId('SSN') // → "SSN-K5R8W2T-F7E9D1C3B5A70864"
 */
export function generateSovereignId(prefix: SovereignIdPrefix): string {
  const timestamp = getTimestampBase36();
  const random = getRandomHex();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * التحقق من صحة معرف سيادي معين
 *
 * يفحص أن المعرف يتبع الصيغة الصحيحة: {PREFIX}-{BASE36}-{HEX}
 *
 * @param id - المعرف المراد التحقق منه
 * @param expectedPrefix - النمط المتوقع (اختياري)
 * @returns true إذا كان المعرف صحيح الصيغة
 */
export function isValidSovereignId(id: string, expectedPrefix?: SovereignIdPrefix): boolean {
  const pattern = expectedPrefix
    ? new RegExp(`^${expectedPrefix}-[0-9A-Z]+-[0-9A-F]{16}$`)
    : /^(CTX|EVT|SSN)-[0-9A-Z]+-[0-9A-F]{16}$/;

  return pattern.test(id);
}
