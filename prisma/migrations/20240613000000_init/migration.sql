-- ═══════════════════════════════════════════════════════════════════════
-- 🏛️ التهجير الأولي — Initial Migration
-- منصة المدقق الديناميكي الموحد V3.0
-- PostgreSQL — Optimistic Concurrency Control — Idempotency — Audit Trail
-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ الصق هذا SQL في Supabase SQL Editor ثم اضغط Run
-- ═══════════════════════════════════════════════════════════════════════

-- ─── التعدادات (Enums) ───

CREATE TYPE "EventStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED', 'RETRYABLE');
CREATE TYPE "StructuralStatus" AS ENUM ('SUCCESS', 'PUNCHING_FAILURE', 'CRITICAL_ERROR');
CREATE TYPE "RtmStatus" AS ENUM ('PASSED', 'FAILED');
CREATE TYPE "SyncQueueStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'FAILED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "Permission" AS ENUM ('CAN_RUN_ENGINE', 'CAN_MODIFY_INPUTS', 'CAN_VIEW_REPORTS', 'CAN_EXPORT_DATA', 'CAN_MODIFY_BASELINE', 'CAN_MANAGE_PROJECTS', 'CAN_AUDIT');

-- ─── 1. سجلات المعالجة ومنع التكرار ───

CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processingToken" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PROCESSING',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "responsePayload" JSONB,
    "processingExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessedEvent_payloadHash_key" ON "ProcessedEvent"("payloadHash");
CREATE UNIQUE INDEX "ProcessedEvent_eventId_key" ON "ProcessedEvent"("eventId");
CREATE INDEX "ProcessedEvent_status_idx" ON "ProcessedEvent"("status");

-- ─── 2. مشاريع التدقيق الإنشائي ───

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBaselineLocked" BOOLEAN NOT NULL DEFAULT false,
    "baselineVersion" TEXT NOT NULL DEFAULT 'V3.0-Locked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_baselineVersion_idx" ON "Project"("baselineVersion");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- ─── 3. السيناريوهات الحسابية ───

CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "outputs" JSONB,
    "resultStatus" "StructuralStatus",
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Scenario_projectId_version_idx" ON "Scenario"("projectId", "version");
CREATE INDEX "Scenario_createdAt_idx" ON "Scenario"("createdAt");

-- ─── 4. سجلات تتبع المتطلبات ───

CREATE TABLE "RtmRecord" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "associatedRequirement" TEXT NOT NULL,
    "status" "RtmStatus" NOT NULL,
    "defectLog" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RtmRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RtmRecord_scenarioId_testCaseId_idx" ON "RtmRecord"("scenarioId", "testCaseId");
CREATE INDEX "RtmRecord_status_idx" ON "RtmRecord"("status");

-- ─── 5. سجل التدقيق التاريخي ───

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_contextId_idx" ON "AuditLog"("createdAt", "contextId");
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- ─── 6. المستخدمين والأدوار والاشتراكات ───

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ENGINEER',
    "syndicateId" TEXT,
    "specialization" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
    "approvedBy" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_syndicateId_key" ON "User"("syndicateId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");
CREATE INDEX "User_role_subscriptionStatus_idx" ON "User"("role", "subscriptionStatus");

-- ─── المفاتيح الأجنبية ───

ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RtmRecord" ADD CONSTRAINT "RtmRecord_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ لا تُدرج سجل _prisma_migrations يدوياً — سيقوم Prisma بإنشائه
--    تلقائياً عند تشغيل prisma migrate deploy على Netlify
-- ═══════════════════════════════════════════════════════════════════════
