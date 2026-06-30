/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🗄️ محول SQLite المحلي — Local SQLite Adapter
 * ═══════════════════════════════════════════════════════════════════════
 *
 * بديل كامل لـ SupabasePrismaClient يعمل محلياً عبر SQLite.
 * يطبق نفس واجهة PrismaLikeDelegate ليعمل بشفافية مع
 * Server Actions الحالية بدون أي تعديل.
 *
 * المميزات:
 *   ✅ واجهة برمجية مطابقة لـ SupabasePrismaClient
 *   ✅ يعمل أوفلاين بالكامل بدون اتصال بالإنترنت
 *   ✅ قاعدة بيانات ملفية واحدة (db/sovereign-local.db)
 *   ✅ إنشاء تلقائي للجداول عند أول تشغيل
 *   ✅ بذر تلقائي لحساب المدير الافتراضي
 *   ✅ دعم كامل للفلاتر والترتيب والعد
 * ═══════════════════════════════════════════════════════════════════════
 */

import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

// ═══════════════════════════════════════════════════════════════════════
// 🛠️ إنشاء اتصال SQLite
// ═══════════════════════════════════════════════════════════════════════

/** مسار قاعدة البيانات المحلية */
const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'sovereign-local.db');

/** ضمان وجود مجلد قاعدة البيانات */
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/** إنشاء اتصال SQLite — Singleton */
const sqlite = new Database(DB_PATH);

// تفعيل WAL mode للأداء الأفضل مع العمليات المتوازية
sqlite.pragma('journal_mode = WAL');
// تفعيل foreign keys
sqlite.pragma('foreign_keys = ON');

// ═══════════════════════════════════════════════════════════════════════
// 📐 إنشاء الجداول
// ═══════════════════════════════════════════════════════════════════════

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    syndicateId TEXT UNIQUE,
    specialization TEXT,
    subscriptionStatus TEXT NOT NULL DEFAULT 'PENDING',
    statusReason TEXT,
    permissions TEXT NOT NULL DEFAULT '[]',
    approvedBy TEXT,
    statusChangedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS Project (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    isBaselineLocked INTEGER NOT NULL DEFAULT 0,
    baselineVersion INTEGER NOT NULL DEFAULT 1,
    ownerId TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ownerId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS Scenario (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    inputs TEXT NOT NULL DEFAULT '{}',
    outputs TEXT DEFAULT '{}',
    resultStatus TEXT DEFAULT 'SUCCESS',
    version INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS RtmRecord (
    id TEXT PRIMARY KEY,
    scenarioId TEXT NOT NULL,
    testCaseId TEXT NOT NULL,
    associatedRequirement TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PASSED',
    evidence TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (scenarioId) REFERENCES Scenario(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS AuditLog (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    contextId TEXT NOT NULL,
    action TEXT NOT NULL,
    performedBy TEXT NOT NULL,
    userRole TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'INFO',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ProcessedEvent (
    id TEXT PRIMARY KEY,
    payloadHash TEXT UNIQUE,
    eventId TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'PROCESSING',
    processingToken TEXT,
    responsePayload TEXT,
    attemptCount INTEGER NOT NULL DEFAULT 0,
    processingExpiresAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
  CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
  CREATE INDEX IF NOT EXISTS idx_user_subscription ON User(subscriptionStatus);
  CREATE INDEX IF NOT EXISTS idx_scenario_project ON Scenario(projectId);
  CREATE INDEX IF NOT EXISTS idx_rtm_scenario ON RtmRecord(scenarioId);
  CREATE INDEX IF NOT EXISTS idx_audit_context ON AuditLog(contextId);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON AuditLog(createdAt);
  CREATE INDEX IF NOT EXISTS idx_processed_payload ON ProcessedEvent(payloadHash);
  CREATE INDEX IF NOT EXISTS idx_processed_event ON ProcessedEvent(eventId);
`;

// تنفيذ إنشاء الجداول في معاملة واحدة
const initTx = sqlite.transaction(() => {
  sqlite.exec(CREATE_TABLES_SQL);
});
initTx();

// ═══════════════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة
// ═══════════════════════════════════════════════════════════════════════

/** توليد UUID v4 */
function generateId(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/** تحويل JSON fields من/إلى نص */
interface ColumnMapping {
  jsonColumns: string[];
  dateColumns: string[];
  booleanColumns: string[];
}

const TABLE_MAPPINGS: Record<string, ColumnMapping> = {
  User: {
    jsonColumns: ['permissions'],
    dateColumns: ['statusChangedAt', 'createdAt', 'updatedAt'],
    booleanColumns: [],
  },
  Project: {
    jsonColumns: [],
    dateColumns: ['createdAt', 'updatedAt'],
    booleanColumns: ['isBaselineLocked'],
  },
  Scenario: {
    jsonColumns: ['inputs', 'outputs'],
    dateColumns: ['createdAt', 'updatedAt'],
    booleanColumns: [],
  },
  RtmRecord: {
    jsonColumns: ['evidence'],
    dateColumns: ['createdAt', 'updatedAt'],
    booleanColumns: [],
  },
  AuditLog: {
    jsonColumns: ['metadata'],
    dateColumns: ['createdAt'],
    booleanColumns: [],
  },
  ProcessedEvent: {
    jsonColumns: ['responsePayload'],
    dateColumns: ['processingExpiresAt', 'createdAt', 'updatedAt'],
    booleanColumns: [],
  },
};

/** تحويل سجل SQLite (نصوص) إلى كائن JavaScript */
function parseRow(row: Record<string, unknown> | undefined, table: string): Record<string, unknown> | null {
  if (!row) return null;

  const mapping = TABLE_MAPPINGS[table];
  if (!mapping) return row as Record<string, unknown>;

  const result: Record<string, unknown> = { ...row };

  for (const col of mapping.jsonColumns) {
    if (typeof result[col] === 'string') {
      try {
        result[col] = JSON.parse(result[col] as string);
      } catch {
        // ترك القيمة كما هي
      }
    }
  }

  for (const col of mapping.booleanColumns) {
    if (result[col] !== undefined && result[col] !== null) {
      result[col] = Boolean(result[col]);
    }
  }

  // تحويل تواريخ ISO النصية إلى كائنات Date
  for (const col of mapping.dateColumns) {
    if (typeof result[col] === 'string' && result[col]) {
      result[col] = new Date(result[col] as string);
    }
  }

  return result;
}

/** تحويل كائن JavaScript لقيم SQLite */
function serializeData(data: Record<string, unknown>, table: string): Record<string, unknown> {
  const mapping = TABLE_MAPPINGS[table];
  if (!mapping) return data;

  const result: Record<string, unknown> = { ...data };

  for (const col of mapping.jsonColumns) {
    if (result[col] !== undefined && result[col] !== null && typeof result[col] !== 'string') {
      result[col] = JSON.stringify(result[col]);
    }
  }

  for (const col of mapping.booleanColumns) {
    if (typeof result[col] === 'boolean') {
      result[col] = result[col] ? 1 : 0;
    }
  }

  for (const col of mapping.dateColumns) {
    if (result[col] instanceof Date) {
      result[col] = (result[col] as Date).toISOString();
    }
  }

  return result;
}

/** بناء شرط WHERE من فلاتر Prisma-like */
function buildWhereClause(where: Record<string, unknown>, params: unknown[]): string {
  const conditions: string[] = [];

  for (const [column, value] of Object.entries(where)) {
    if (value === null) {
      conditions.push(`${column} IS NULL`);
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const condition = value as Record<string, unknown>;
      if ('in' in condition && Array.isArray(condition.in)) {
        const placeholders = condition.in.map(() => '?').join(',');
        conditions.push(`${column} IN (${placeholders})`);
        params.push(...condition.in);
      } else if ('contains' in condition) {
        conditions.push(`${column} LIKE ?`);
        params.push(`%${condition.contains}%`);
      } else if ('startsWith' in condition) {
        conditions.push(`${column} LIKE ?`);
        params.push(`${condition.startsWith}%`);
      } else if ('endsWith' in condition) {
        conditions.push(`${column} LIKE ?`);
        params.push(`%${condition.endsWith}`);
      } else if ('not' in condition) {
        conditions.push(`${column} != ?`);
        params.push(condition.not);
      } else if ('gt' in condition) {
        conditions.push(`${column} > ?`);
        params.push(condition.gt);
      } else if ('gte' in condition) {
        conditions.push(`${column} >= ?`);
        params.push(condition.gte);
      } else if ('lt' in condition) {
        conditions.push(`${column} < ?`);
        params.push(condition.lt);
      } else if ('lte' in condition) {
        conditions.push(`${column} <= ?`);
        params.push(condition.lte);
      }
    } else {
      conditions.push(`${column} = ?`);
      params.push(value);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

// ═══════════════════════════════════════════════════════════════════════
// 🗄️ SQLite Prisma-like Delegate
// ═══════════════════════════════════════════════════════════════════════

/**
 * محول جدول SQLite بأسلوب Prisma
 *
 * واجهة مطابقة تماماً لـ PrismaLikeDelegate في supabase-adapter.ts:
 *   - findUnique({ where: { ... } })
 *   - findFirst({ where: { ... }, orderBy: { ... } })
 *   - findMany({ where: { ... }, orderBy: { ... }, take: N, skip: N })
 *   - create({ data: { ... } })
 *   - update({ where: { ... }, data: { ... } })
 *   - delete({ where: { ... } })
 *   - count({ where: { ... } })
 */
class SqliteDelegate {
  constructor(
    private readonly db: Database.Database,
    private readonly table: string
  ) {}

  async findUnique(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown | null> {
    const params: unknown[] = [];
    const whereClause = buildWhereClause(args.where, params);
    const selectClause = args.select ? Object.keys(args.select).join(',') : '*';

    const sql = `SELECT ${selectClause} FROM ${this.table} ${whereClause} LIMIT 1`;
    const row = this.db.prepare(sql).get(...params) as Record<string, unknown> | undefined;

    return parseRow(row, this.table);
  }

  async findFirst(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    select?: Record<string, boolean>;
  }): Promise<unknown | null> {
    const params: unknown[] = [];
    const whereClause = args.where ? buildWhereClause(args.where, params) : '';
    const selectClause = args.select ? Object.keys(args.select).join(',') : '*';

    let sql = `SELECT ${selectClause} FROM ${this.table} ${whereClause}`;

    if (args.orderBy) {
      const [column, direction] = Object.entries(args.orderBy)[0];
      sql += ` ORDER BY ${column} ${direction === 'asc' ? 'ASC' : 'DESC'}`;
    }

    sql += ' LIMIT 1';

    const row = this.db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
    return parseRow(row, this.table);
  }

  async findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
    select?: Record<string, boolean>;
  }): Promise<unknown[]> {
    const params: unknown[] = [];
    const whereClause = args?.where ? buildWhereClause(args.where, params) : '';
    const selectClause = args?.select ? Object.keys(args.select).join(',') : '*';

    let sql = `SELECT ${selectClause} FROM ${this.table} ${whereClause}`;

    if (args?.orderBy) {
      const [column, direction] = Object.entries(args.orderBy)[0];
      sql += ` ORDER BY ${column} ${direction === 'asc' ? 'ASC' : 'DESC'}`;
    }

    if (args?.take) sql += ` LIMIT ${args.take}`;
    if (args?.skip) sql += ` OFFSET ${args.skip}`;

    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map(row => parseRow(row, this.table));
  }

  async create(args: { data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown> {
    const serialized = serializeData(args.data, this.table);

    // إضافة id تلقائياً إذا لم يكن موجوداً
    if (!serialized.id) {
      serialized.id = generateId();
    }

    // إضافة createdAt/updatedAt تلقائياً
    if (!serialized.createdAt && TABLE_MAPPINGS[this.table]?.dateColumns?.includes('createdAt')) {
      serialized.createdAt = new Date().toISOString();
    }
    if (!serialized.updatedAt && TABLE_MAPPINGS[this.table]?.dateColumns?.includes('updatedAt')) {
      serialized.updatedAt = new Date().toISOString();
    }

    const columns = Object.keys(serialized);
    const placeholders = columns.map(() => '?').join(',');
    const values = Object.values(serialized);

    const sql = `INSERT INTO ${this.table} (${columns.join(',')}) VALUES (${placeholders})`;
    this.db.prepare(sql).run(...values);

    // إرجاع السجل المنشأ
    const created = this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(serialized.id) as Record<string, unknown>;
    return parseRow(created, this.table);
  }

  async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown> {
    const serialized = serializeData(args.data, this.table);

    // تحديث updatedAt تلقائياً
    if (TABLE_MAPPINGS[this.table]?.dateColumns?.includes('updatedAt')) {
      serialized.updatedAt = new Date().toISOString();
    }

    const setClauses = Object.keys(serialized).map(key => `${key} = ?`);
    const setValues = Object.values(serialized);

    const whereParams: unknown[] = [];
    const whereClause = buildWhereClause(args.where, whereParams);

    const sql = `UPDATE ${this.table} SET ${setClauses.join(', ')} ${whereClause}`;
    this.db.prepare(sql).run(...setValues, ...whereParams);

    // إرجاع السجل المحدث
    const whereParams2: unknown[] = [];
    const whereClause2 = buildWhereClause(args.where, whereParams2);
    const updated = this.db.prepare(`SELECT * FROM ${this.table} ${whereClause2}`).get(...whereParams2) as Record<string, unknown> | undefined;
    return parseRow(updated, this.table);
  }

  async delete(args: { where: Record<string, unknown> }): Promise<unknown> {
    // جلب السجل قبل حذفه
    const whereParams: unknown[] = [];
    const whereClause = buildWhereClause(args.where, whereParams);
    const existing = this.db.prepare(`SELECT * FROM ${this.table} ${whereClause}`).get(...whereParams) as Record<string, unknown> | undefined;

    const deleted = parseRow(existing, this.table);

    // حذف السجل
    const deleteParams: unknown[] = [];
    const deleteWhereClause = buildWhereClause(args.where, deleteParams);
    this.db.prepare(`DELETE FROM ${this.table} ${deleteWhereClause}`).run(...deleteParams);

    return deleted;
  }

  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    const params: unknown[] = [];
    const whereClause = args?.where ? buildWhereClause(args.where, params) : '';

    const sql = `SELECT COUNT(*) as count FROM ${this.table} ${whereClause}`;
    const result = this.db.prepare(sql).get(...params) as { count: number };
    return result.count;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🏛️ عميل قاعدة البيانات المحلية — SQLite Prisma-like Client
// ═══════════════════════════════════════════════════════════════════════

/**
 * عميل قاعدة البيانات المحلية SQLite
 *
 * واجهة مطابقة تماماً لـ SupabasePrismaClient:
 *   - user, project, scenario, rtmRecord, auditLog, processedEvent
 *
 * @example
 * const user = await localDb.user.findUnique({ where: { email } });
 * await localDb.user.create({ data: { ... } });
 */
class SqlitePrismaClient {
  public readonly user: SqliteDelegate;
  public readonly project: SqliteDelegate;
  public readonly scenario: SqliteDelegate;
  public readonly rtmRecord: SqliteDelegate;
  public readonly auditLog: SqliteDelegate;
  public readonly processedEvent: SqliteDelegate;

  constructor() {
    this.user = new SqliteDelegate(sqlite, 'User');
    this.project = new SqliteDelegate(sqlite, 'Project');
    this.scenario = new SqliteDelegate(sqlite, 'Scenario');
    this.rtmRecord = new SqliteDelegate(sqlite, 'RtmRecord');
    this.auditLog = new SqliteDelegate(sqlite, 'AuditLog');
    this.processedEvent = new SqliteDelegate(sqlite, 'ProcessedEvent');
  }

  async $connect(): Promise<void> {
    console.log('[SqlitePrismaClient] Connected to local SQLite database');
  }

  async $disconnect(): Promise<void> {
    sqlite.close();
  }

  async $executeRaw(): Promise<never> {
    throw new Error('[SqlitePrismaClient] $executeRaw is not supported via this adapter');
  }

  async $queryRaw(): Promise<never> {
    throw new Error('[SqlitePrismaClient] $queryRaw is not supported via this adapter');
  }

  /**
   * تنفيذ معاملة (transaction) — مدعومة فعلياً في SQLite
   */
  async $transaction<T>(fn: (tx: SqlitePrismaClient) => Promise<T>): Promise<T> {
    const txDb = new SqlitePrismaClient();
    sqlite.exec('BEGIN');
    try {
      const result = await fn(txDb);
      sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * الحصول على اتصال SQLite المباشر — للاستخدام المتقدم فقط
   */
  getRawDb(): Database.Database {
    return sqlite;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🌱 بذر حساب المدير الافتراضي
// ═══════════════════════════════════════════════════════════════════════

import { hashPassword } from '@/lib/password';

/** بذر المدير الافتراضي — يُستدعى مرة واحدة */
async function seedDefaultAdmin(client: SqlitePrismaClient): Promise<void> {
  // التحقق من وجود مدير بالفعل
  const existingAdmin = await client.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('[SqliteAdapter] Admin already exists — skipping seed');
    return;
  }

  const passwordHash = await hashPassword('Admin@2024');
  await client.user.create({
    data: {
      email: 'abu-sulaiman@structural-blast.sy',
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

  console.log('[SqliteAdapter] Default admin seeded: abu-sulaiman@structural-blast.sy / Admin@2024');
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 تصدير النسخة الوحيدة — Singleton Export
// ═══════════════════════════════════════════════════════════════════════

let _localDbInstance: SqlitePrismaClient | null = null;
let _seedPromise: Promise<void> | null = null;

function getLocalDb(): SqlitePrismaClient {
  if (_localDbInstance) return _localDbInstance;

  _localDbInstance = new SqlitePrismaClient();

  // بذر المدير الافتراضي بشكل غير حاجب
  _seedPromise = seedDefaultAdmin(_localDbInstance).catch(err => {
    console.error('[SqliteAdapter] Failed to seed default admin:', err);
  });

  return _localDbInstance;
}

/**
 * التحقق من اكتمال بذر المدير
 */
export async function waitForSeed(): Promise<void> {
  if (_seedPromise) {
    await _seedPromise;
  }
}

/**
 * عميل قاعدة البيانات المحلية
 *
 * يُصدَّر باسم `localDb` للاستخدام في طبقة التبديل
 */
export const localDb = getLocalDb();

/** تصدير باسم prisma للتوافق */
export const prisma = localDb;

/** تصدير باسم db للتوافق */
export const db = localDb;

export default localDb;
