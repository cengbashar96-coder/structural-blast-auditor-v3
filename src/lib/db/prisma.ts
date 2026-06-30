/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔌 عميل قاعدة البيانات الموحد — Database Client Singleton
 * ═══════════════════════════════════════════════════════════════════════
 *
 * تبديل تلقائي بين Supabase REST API و SQLite المحلي:
 *   - إذا Supabase متاح → يستخدم REST API
 *   - خلاف ذلك → يستخدم SQLite المحلي (أوفلاين)
 *
 * ⚠️ لإجبار الوضع الأوفلاين: FORCE_OFFLINE=true
 * ═══════════════════════════════════════════════════════════════════════
 */

// تصدير المحول الموحد كـ prisma و db
export { unifiedDb as prisma, unifiedDb as db, checkDatabaseConnection } from './unified-adapter';
