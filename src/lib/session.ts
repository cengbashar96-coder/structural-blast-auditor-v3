/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔐 نظام الجلسات الخادومية الآمنة — Server-Side Session Management
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يعتمد على CryptoVault لتشفير وفك تشفير بيانات الجلسة (UserSession).
 * يزرع ويقرأ الجلسة عبر Server-Set Cookies بخصائص أمنية صارمة.
 *
 * خصائص الأمان:
 *   ✅ httpOnly: true      — حظر كامل للوصول من JavaScript في المتصفح
 *   ✅ sameSite: 'lax'     — حماية ضد هجمات CSRF مع السماح بالتنقل
 *   ✅ secure: true        — الإنتاج فقط — نقل الحلوية عبر HTTPS فقط
 *   ✅ maxAge: 1800        — 30 دقيقة فقط (Short-lived Session)
 *   ✅ path: '/'           — نطاق الحلوية يشمل التطبيق بالكامل
 *
 * ⚠️ لا تُستخدم localStorage للجلسة أو الأدوار الحساسة نهائياً
 * ⚠️ جميع البيانات الحساسة مشفرة ومخزنة في حلوية httpOnly
 *
 * ملاحظات بيئة Netlify:
 *   - Server Actions تعمل كـ Netlify Functions
 *   - Cookies تُدار عبر next/headers وتعمل بشكل طبيعي
 *   - sameSite: 'strict' قد يسبب مشاكل مع redirects → نستخدم 'lax'
 * ═══════════════════════════════════════════════════════════════════════
 */

import { cookies } from 'next/headers';
import { getCryptoVault } from '@/lib/crypto-vault';
import { generateSovereignId } from '@/lib/id-utility';
import { USER_ROLES, type RbacUser } from '@/lib/rbac';

/** اسم حلوية الجلسة */
const SESSION_COOKIE_NAME = 'sbv3-session';

/** عمر الجلسة بالثواني: 30 دقيقة */
export const SESSION_MAX_AGE = 30 * 60; // 1800 ثانية

/** واجهة بيانات الجلسة الكاملة */
export interface UserSession {
  /** معرف الجلسة السيادي (نمط SSN) */
  sessionId: string;
  /** معرف المستخدم السيادي */
  userId: string;
  /** دور المستخدم */
  role: USER_ROLES;
  /** اسم المستخدم الكامل */
  displayName: string;
  /** رقم النقابة (للمهندسين) */
  syndicateId?: string;
  /** التخصص الهندسي */
  specialization?: string;
  /** لحظة إنشاء الجلسة (timestamp) */
  createdAt: number;
  /** لحظة آخر تجديد للجلسة */
  lastRefreshedAt: number;
  /** عنوان IP عند إنشاء الجلسة (اختياري - للمراجعة الأمنية) */
  originatingIp?: string;
}

/**
 * تحويل UserSession إلى RbacUser للاستخدام في طبقة RBAC
 */
export function sessionToRbacUser(session: UserSession): RbacUser {
  return {
    userId: session.userId,
    role: session.role,
    displayName: session.displayName,
    syndicateId: session.syndicateId,
    specialization: session.specialization,
  };
}

/**
 * إنشاء جلسة جديدة للمستخدم
 *
 * @param params - بيانات المستخدم الأساسية
 * @returns كائن الجلسة الكامل
 */
export function createUserSession(params: {
  userId: string;
  role: USER_ROLES;
  displayName: string;
  syndicateId?: string;
  specialization?: string;
  originatingIp?: string;
}): UserSession {
  const now = Date.now();
  return {
    sessionId: generateSovereignId('SSN'),
    userId: params.userId,
    role: params.role,
    displayName: params.displayName,
    syndicateId: params.syndicateId,
    specialization: params.specialization,
    createdAt: now,
    lastRefreshedAt: now,
    originatingIp: params.originatingIp,
  };
}

/**
 * زرع الجلسة في حلوية مشفرة
 *
 * يقوم بتشفير بيانات الجلسة باستخدام CryptoVault
 * ثم يزرعها كحلوية httpOnly آمنة.
 *
 * ⚠️ يجب استدعاؤه فقط من Server Actions أو Route Handlers
 *
 * @param session - بيانات الجلسة المراد زرعها
 */
export async function setSessionCookie(session: UserSession): Promise<void> {
  try {
    const vault = getCryptoVault();
    const encryptedPayload = vault.encrypt(JSON.stringify(session));

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encryptedPayload, {
      httpOnly: true,
      // ❗ sameSite: 'strict' يمنع إرسال الكوكي بعد redirect خارجي
      // نستخدم 'lax' للسماح بالتنقل مع الحفاظ على الحماية من CSRF
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  } catch (error) {
    console.error('[Session] Failed to set session cookie:', error);
    throw new Error('فشل إنشاء جلسة المصادقة — تحقق من ENCRYPTION_KEY');
  }
}

/**
 * قراءة الجلسة من الحلوية المشفرة
 *
 * يقرأ الحلوية، يفك تشفيرها، ويتحقق من صلاحية البيانات.
 * في حال انتهاء الصلاحية أو فساد البيانات، يُرجع null.
 *
 * ⚠️ يجب استدعاؤه فقط من Server Actions أو Route Handlers
 *
 * @returns بيانات الجلسة أو null إذا لم تكن صالحة
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const encryptedPayload = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!encryptedPayload) {
      return null;
    }

    // فك التشفير — يُقذف ERR-CRYPTO-INVALID-FORMAT عند أي تلاعب
    const vault = getCryptoVault();
    const decryptedJson = vault.decrypt(encryptedPayload);
    const session: UserSession = JSON.parse(decryptedJson);

    // التحقق من انتهاء صلاحية الجلسة (30 دقيقة من آخر تجديد)
    const now = Date.now();
    const elapsedSeconds = (now - session.lastRefreshedAt) / 1000;

    if (elapsedSeconds > SESSION_MAX_AGE) {
      // الجلسة منتهية الصلاحية — حذف الحلوية
      await destroySession();
      return null;
    }

    return session;
  } catch (error) {
    // أي خطأ في فك التشفير أو التحليل → الجلسة غير صالحة
    console.warn('[Session] Failed to read session:', error instanceof Error ? error.message : 'unknown');
    // لا ندمر الجلسة هنا لتجنب الأخطاء المتسلسلة
    return null;
  }
}

/**
 * تجديد الجلسة — تمديد عمرها 30 دقيقة إضافية
 *
 * يُستدعى تلقائياً عند أي نشاط للمستخدم للحفاظ على الجلسة حية.
 * يعيد تشفير الجلسة وتحديث lastRefreshedAt.
 *
 * @returns الجلسة المجددة أو null إذا لم تكن صالحة
 */
export async function refreshSession(): Promise<UserSession | null> {
  const session = await getSession();
  if (!session) return null;

  session.lastRefreshedAt = Date.now();
  await setSessionCookie(session);
  return session;
}

/**
 * تدمير الجلسة — حذف الحلوية المشفرة بالكامل
 *
 * يُستدعى عند تسجيل الخروج أو عند اكتشاف نشاط مشبوه.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // تجاهل الأخطاء عند تدمير الجلسة
  }
}

/**
 * التحقق من أن الجلسة نشطة وصالحة (بدون تجديد)
 *
 * @returns true إذا كانت الجلسة صالحة، false خلاف ذلك
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
