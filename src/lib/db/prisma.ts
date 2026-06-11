/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔌 عميل Prisma الموحد — Prisma Client Singleton
 * ═══════════════════════════════════════════════════════════════════════
 *
 * يُوفّر نسخة واحدة مشتركة من PrismaClient عبر التطبيق بأكمله.
 * في بيئة التطوير، يُخزّن النسخة في globalThis لمنع إنشاء
 * اتصالات متعددة بسبب Hot Module Replacement (HMR).
 *
 * ⚠️ في بيئة الإنتاج: يتم إنشاء نسخة واحدة فقط لكل process
 * ⚠️ يجب تشغيل prisma generate قبل الاستخدام
 * ═══════════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client';

/** تمديد globalType لدعم HMR في التطوير */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * prisma — النسخة الوحيدة من PrismaClient
 *
 * في التطوير: يُعيد استخدام النسخة المخزنة في globalThis
 * في الإنتاج: يُنشئ نسخة جديدة واحدة فقط
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

/** تخزين النسخة في التطوير لمنع التسريب (HMR Protection) */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * إغلاق اتصال Prisma — يجب استدعاؤها عند إيقاف التطبيق
 *
 * @example
 * process.on('beforeExit', async () => { await prismaDisconnect(); });
 */
export async function prismaDisconnect(): Promise<void> {
  await prisma.$disconnect();
}
