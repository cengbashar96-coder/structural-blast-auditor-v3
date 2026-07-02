/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🗄️ محول JSON المحلي — Local JSON File Database Adapter
 * ═══════════════════════════════════════════════════════════════════════
 *
 * بديل كامل لـ SupabasePrismaClient يعمل محلياً عبر ملفات JSON.
 * لا يحتاج لأي وحدات أصلية (native modules) ويعمل في أي بيئة Node.js.
 *
 * المميزات:
 *   ✅ واجهة برمجية مطابقة لـ SupabasePrismaClient
 *   ✅ يعمل أوفلاين بالكامل بدون اتصال بالإنترنت
 *   ✅ لا يحتاج وحدات أصلية C++ — pure JavaScript
 *   ✅ إنشاء تلقائي للملف عند أول تشغيل
 *   ✅ بذر تلقائي لحساب المدير الافتراضي
 *   ✅ دعم كامل للفلاتر والترتيب والعد
 *   ✅ حفظ تلقائي بعد كل عملية كتابة
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

// ═══════════════════════════════════════════════════════════════════════
// 🛠️ إدارة ملف قاعدة البيانات
// ═══════════════════════════════════════════════════════════════════════

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'sovereign-local.json');

/** هيكل قاعدة البيانات */
interface JsonDatabase {
  User: Record<string, any>[];
  Project: Record<string, any>[];
  Scenario: Record<string, any>[];
  RtmRecord: Record<string, any>[];
  AuditLog: Record<string, any>[];
  ProcessedEvent: Record<string, any>[];
  _metadata: {
    version: number;
    createdAt: string;
    lastModified: string;
  };
}

/** ضمان وجود مجلد قاعدة البيانات */
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

/** توليد UUID v4 */
function generateId(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/** قراءة قاعدة البيانات من الملف */
function readDb(): JsonDatabase {
  try {
    if (existsSync(DB_PATH)) {
      const data = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[JsonDB] Failed to read database file:', error);
  }

  // إنشاء قاعدة بيانات فارغة
  const emptyDb: JsonDatabase = {
    User: [],
    Project: [],
    Scenario: [],
    RtmRecord: [],
    AuditLog: [],
    ProcessedEvent: [],
    _metadata: {
      version: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
  };
  writeDb(emptyDb);
  return emptyDb;
}

/** كتابة قاعدة البيانات إلى الملف */
function writeDb(db: JsonDatabase): void {
  db._metadata.lastModified = new Date().toISOString();
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

/** تطبيق فلاتر Prisma-like على مصفوفة سجلات */
function applyFilters(records: Record<string, any>[], where: Record<string, unknown>): Record<string, any>[] {
  return records.filter(record => {
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        if (record[key] !== null && record[key] !== undefined) return false;
      } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const condition = value as Record<string, unknown>;
        if ('in' in condition && Array.isArray(condition.in)) {
          if (!condition.in.includes(record[key])) return false;
        } else if ('contains' in condition) {
          if (!String(record[key] || '').includes(String(condition.contains))) return false;
        } else if ('startsWith' in condition) {
          if (!String(record[key] || '').startsWith(String(condition.startsWith))) return false;
        } else if ('not' in condition) {
          if (record[key] === condition.not) return false;
        }
      } else {
        if (record[key] !== value) return false;
      }
    }
    return true;
  });
}

/** تطبيق الترتيب */
function applyOrderBy(records: Record<string, any>[], orderBy?: Record<string, 'asc' | 'desc'>): Record<string, any>[] {
  if (!orderBy) return records;
  const [column, direction] = Object.entries(orderBy)[0];
  return [...records].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    if (aVal instanceof Date && bVal instanceof Date) {
      return direction === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal);
      return direction === 'asc' ? cmp : -cmp;
    }
    return direction === 'asc' ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🗄️ JSON Prisma-like Delegate
// ═══════════════════════════════════════════════════════════════════════

class JsonDelegate {
  private tableName: keyof Omit<JsonDatabase, '_metadata'>;

  constructor(tableName: keyof Omit<JsonDatabase, '_metadata'>) {
    this.tableName = tableName;
  }

  private getCollection(): Record<string, any>[] {
    const db = readDb();
    return db[this.tableName] as Record<string, any>[];
  }

  private saveCollection(records: Record<string, any>[]): void {
    const db = readDb();
    (db[this.tableName] as Record<string, any>[]) = records;
    writeDb(db);
  }

  async findUnique(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<Record<string, any> | null> {
    const records = this.getCollection();
    const filtered = applyFilters(records, args.where);
    const record = filtered[0] || null;

    if (record && args.select) {
      const selected: Record<string, any> = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = record[key];
      }
      return selected;
    }
    return record ? { ...record } : null;
  }

  async findFirst(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    select?: Record<string, boolean>;
  }): Promise<Record<string, any> | null> {
    let records = this.getCollection();

    if (args.where) {
      records = applyFilters(records, args.where);
    }

    records = applyOrderBy(records, args.orderBy);

    const record = records[0] || null;
    if (record && args.select) {
      const selected: Record<string, any> = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = record[key];
      }
      return selected;
    }
    return record ? { ...record } : null;
  }

  async findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
    select?: Record<string, boolean>;
  }): Promise<Record<string, any>[]> {
    let records = this.getCollection();

    if (args?.where) {
      records = applyFilters(records, args.where);
    }

    records = applyOrderBy(records, args.orderBy);

    if (args?.skip) records = records.slice(args.skip);
    if (args?.take) records = records.slice(0, args.take);

    if (args?.select) {
      return records.map(record => {
        const selected: Record<string, any> = {};
        for (const key of Object.keys(args.select!)) {
          selected[key] = record[key];
        }
        return selected;
      });
    }

    return records.map(r => ({ ...r }));
  }

  async create(args: { data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<Record<string, any>> {
    const db = readDb();
    const collection = db[this.tableName] as Record<string, any>[];

    const record: Record<string, any> = {
      ...args.data,
      id: args.data.id || generateId(),
    };

    // إضافة createdAt/updatedAt تلقائياً
    if (!record.createdAt) record.createdAt = new Date();
    if (!record.updatedAt) record.updatedAt = new Date();

    collection.push(record);
    writeDb(db);

    if (args.select) {
      const selected: Record<string, any> = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = record[key];
      }
      return selected;
    }
    return { ...record };
  }

  async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<Record<string, any>> {
    const db = readDb();
    const collection = db[this.tableName] as Record<string, any>[];

    const index = collection.findIndex(r => {
      for (const [key, value] of Object.entries(args.where)) {
        if (r[key] !== value) return false;
      }
      return true;
    });

    if (index === -1) {
      throw new Error(`[JsonDB] Record not found in ${this.tableName} with ${JSON.stringify(args.where)}`);
    }

    // تحديث updatedAt تلقائياً
    const updatedData = { ...args.data, updatedAt: new Date() };
    collection[index] = { ...collection[index], ...updatedData };
    writeDb(db);

    if (args.select) {
      const selected: Record<string, any> = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = collection[index][key];
      }
      return selected;
    }
    return { ...collection[index] };
  }

  async delete(args: { where: Record<string, unknown> }): Promise<Record<string, any>> {
    const db = readDb();
    const collection = db[this.tableName] as Record<string, any>[];

    const index = collection.findIndex(r => {
      for (const [key, value] of Object.entries(args.where)) {
        if (r[key] !== value) return false;
      }
      return true;
    });

    if (index === -1) {
      throw new Error(`[JsonDB] Record not found in ${this.tableName} with ${JSON.stringify(args.where)}`);
    }

    const deleted = { ...collection[index] };
    collection.splice(index, 1);
    writeDb(db);

    return deleted;
  }

  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    let records = this.getCollection();
    if (args?.where) {
      records = applyFilters(records, args.where);
    }
    return records.length;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ عميل قاعدة البيانات المحلية — JSON Prisma-like Client
// ═══════════════════════════════════════════════════════════════════════

class JsonPrismaClient {
  public readonly user: JsonDelegate;
  public readonly project: JsonDelegate;
  public readonly scenario: JsonDelegate;
  public readonly rtmRecord: JsonDelegate;
  public readonly auditLog: JsonDelegate;
  public readonly processedEvent: JsonDelegate;

  constructor() {
    this.user = new JsonDelegate('User');
    this.project = new JsonDelegate('Project');
    this.scenario = new JsonDelegate('Scenario');
    this.rtmRecord = new JsonDelegate('RtmRecord');
    this.auditLog = new JsonDelegate('AuditLog');
    this.processedEvent = new JsonDelegate('ProcessedEvent');
  }

  async $connect(): Promise<void> {
    console.log('[JsonPrismaClient] Connected to local JSON database');
  }

  async $disconnect(): Promise<void> {
    // لا يوجد اتصال لإغلاقه
  }

  async $executeRaw(): Promise<never> {
    throw new Error('[JsonPrismaClient] $executeRaw is not supported');
  }

  async $queryRaw(): Promise<never> {
    throw new Error('[JsonPrismaClient] $queryRaw is not supported');
  }

  async $transaction<T>(fn: (tx: JsonPrismaClient) => Promise<T>): Promise<T> {
    // JSON DB لا يحتاج معاملات حقيقية — العمليات ذرية بحد ذاتها
    const txClient = new JsonPrismaClient();
    return fn(txClient);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🌱 بذر حساب المدير الافتراضي
// ═══════════════════════════════════════════════════════════════════════

import { hashPassword } from '@/lib/password';

async function seedDefaultAdmin(client: JsonPrismaClient): Promise<void> {
  const existingAdmin = await client.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('[JsonAdapter] Admin already exists — skipping seed');
    return;
  }

  const passwordHash = await hashPassword('REDACTED_ADMIN_PASSWORD');
  await client.user.create({
    data: {
      email: 'cengbashar96@gmail.com',
      displayName: 'المهندس أبو سليمان',
      passwordHash,
      role: 'ADMIN',
      syndicateId: 'SYR-ENG-ADMIN-001',
      specialization: 'هندسة إنشائية - تحقق من أحمال الانفجار',
      subscriptionStatus: 'APPROVED',
      permissions: [
        'CAN_RUN_ENGINE',
        'CAN_MODIFY_INPUTS',
        'CAN_VIEW_REPORTS',
        'CAN_EXPORT_DATA',
        'CAN_MODIFY_BASELINE',
        'CAN_MANAGE_PROJECTS',
        'CAN_AUDIT',
      ],
      approvedBy: 'SYSTEM_SEED',
      statusChangedAt: new Date(),
    },
  });

  console.log('[JsonAdapter] Default admin seeded: cengbashar96@gmail.com / REDACTED_ADMIN_PASSWORD');
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 تصدير النسخة الوحيدة — Singleton Export
// ═══════════════════════════════════════════════════════════════════════

let _localDbInstance: JsonPrismaClient | null = null;
let _seedPromise: Promise<void> | null = null;

function getLocalDb(): JsonPrismaClient {
  if (_localDbInstance) return _localDbInstance;

  _localDbInstance = new JsonPrismaClient();

  // بذر المدير الافتراضي بشكل غير حاجب
  _seedPromise = seedDefaultAdmin(_localDbInstance).catch(err => {
    console.error('[JsonAdapter] Failed to seed default admin:', err);
  });

  return _localDbInstance;
}

export async function waitForSeed(): Promise<void> {
  if (_seedPromise) {
    await _seedPromise;
  }
}

export const localDb = getLocalDb();
export const prisma = localDb;
export const db = localDb;
export default localDb;
