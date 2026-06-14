/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔌 عميل قاعدة البيانات الموحد — Database Client Singleton
 * ═══════════════════════════════════════════════════════════════════════
 *
 * في بيئة Netlify Serverless: يستخدم Supabase REST API
 * بدلاً من PrismaClient الذي لا يستطيع الاتصال عبر TCP.
 *
 * ⚠️ جميع عمليات قاعدة البيانات تمر عبر Supabase REST API
 * ⚠️ لا تستخدم PrismaClient مباشرة في Server Actions
 * ═══════════════════════════════════════════════════════════════════════
 */

// تصدير Supabase adapter كـ prisma و db للتوافق مع الكود الحالي
export { supabaseDb as prisma, supabaseDb as db } from './supabase-adapter';
