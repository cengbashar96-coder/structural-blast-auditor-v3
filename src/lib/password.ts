/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔐 وحدة تشفير والتحقق من كلمات المرور — Password Utility
 * ═══════════════════════════════════════════════════════════════════════
 *
 * تعتمد على bcryptjs لتشفير كلمات المرور بصيغة hash
 * والتحقق من مطابقتها عند تسجيل الدخول.
 *
 * خصائص الأمان:
 *   ✅ Salt rounds: 12 — توازن مثالي بين الأمان والأداء
 *   ✅ لا تُخزَّن كلمات المرور بصيغتها الأصلية أبداً
 *   ✅ كل hash فريد حتى لكلمات المرور المتطابقة
 * ═══════════════════════════════════════════════════════════════════════
 */

import bcrypt from 'bcryptjs';

/** عدد جولات التشفير — كلما زاد الرقم زاد الأمان وبطأ التشفير */
const SALT_ROUNDS = 12;

/**
 * تشفير كلمة المرور — تحويل النص الصريح إلى hash
 *
 * @param plaintext - كلمة المرور بصيغتها الأصلية
 * @returns الـ hash المخزن في قاعدة البيانات
 *
 * @example
 * const hash = await hashPassword('MyStr0ngP@ss');
 * // $2a$12$xN3k8R...
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * التحقق من مطابقة كلمة المرور — مقارنة النص الصريح مع الـ hash
 *
 * @param plaintext - كلمة المرور المدخلة من المستخدم
 * @param hash - الـ hash المخزن في قاعدة البيانات
 * @returns true إذا تطابقت، false خلاف ذلك
 *
 * @example
 * const isValid = await verifyPassword('MyStr0ngP@ss', storedHash);
 * if (isValid) { // تسجيل دخول ناجح }
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
