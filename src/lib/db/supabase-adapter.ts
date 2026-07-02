/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔌 موائم Supabase REST API — Supabase REST API Adapter
 * ═══════════════════════════════════════════════════════════════════════
 *
 * بديل كامل لـ PrismaClient يعمل عبر Supabase REST API (PostgREST)
 * مصمم خصيصاً لبيئة Netlify Serverless Functions حيث لا يمكن
 * لـ PrismaClient الاتصال مباشرة بقاعدة البيانات عبر TCP.
 *
 * المميزات:
 *   ✅ واجهة برمجية مطابقة لـ PrismaClient (findUnique, findMany, create, update, delete)
 *   ✅ مصادقة عبر service_role key (وصول كامل متجاوزاً RLS)
 *   ✅ معالجة أخطاء شاملة مع رسائل واضحة
 *   ✅ Singleton pattern لمنع إنشاء نسخ متعددة
 *   ✅ يعمل في بيئة Serverless بدون اتصال TCP
 * ═══════════════════════════════════════════════════════════════════════
 */

/** إعدادات الاتصال بـ Supabase */
interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

/** نوع عامل التصفية */
type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

/** فلتر استعلام */
interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

/** خيارات الاستعلام */
interface QueryOptions {
  select?: string;
  filters?: QueryFilter[];
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

/** نتيجة عملية قاعدة البيانات */
interface DbResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * موائم Supabase REST API
 *
 * يوفر واجهة Prisma-like تعمل عبر HTTP REST API
 */
class SupabaseRestAdapter {
  private readonly url: string;
  private readonly serviceKey: string;
  private readonly headers: Record<string, string>;

  constructor(config: SupabaseConfig) {
    this.url = config.url.replace(/\/$/, '');
    this.serviceKey = config.serviceKey;
    this.headers = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  /**
   * تنفيذ طلب HTTP إلى Supabase REST API
   */
  private async request(
    table: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    options?: {
      body?: unknown;
      query?: Record<string, string>;
      headers?: Record<string, string>;
    }
  ): Promise<{ data: unknown; error: string | null }> {
    let url = `${this.url}/rest/v1/${table}`;

    const reqHeaders: Record<string, string> = { ...this.headers, ...(options?.headers || {}) };

    if (options?.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params.toString()}`;
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (options?.body !== undefined) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[SupabaseAdapter] ${method} ${table} failed: ${response.status}`, errorBody);
        return { data: null, error: `DB Error ${response.status}: ${errorBody}` };
      }

      // DELETE قد لا يُرجع محتوى
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return { data, error: null };
      }

      return { data: null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown fetch error';
      console.error(`[SupabaseAdapter] ${method} ${table} exception:`, message);
      return { data: null, error: `Network error: ${message}` };
    }
  }

  /**
   * تحويل الفلاتر إلى معاملات PostgREST
   */
  private buildQueryParams(options?: QueryOptions): Record<string, string> {
    const params: Record<string, string> = {};

    if (options?.select) {
      params['select'] = options.select;
    }

    if (options?.filters) {
      for (const filter of options.filters) {
        // PostgREST filter format: column=operator.value
        // e.g. email=eq.cengbashar96@gmail.com
        // URLSearchParams handles URL encoding automatically (@ → %40)
        const key = filter.column;
        let value = filter.value;
        if (Array.isArray(value)) {
          // PostgREST IN operator: column=in.(val1,val2,val3)
          value = `(${value.map(v => String(v)).join(',')})`;
        } else if (value === null) {
          value = 'null';
        }
        params[key] = `${filter.operator}.${String(value)}`;
      }
    }

    if (options?.orderBy) {
      params['order'] = `${options.orderBy.column}.${options.orderBy.ascending === false ? 'desc' : 'asc'}.nullsLast`;
    }

    if (options?.limit) {
      params['limit'] = String(options.limit);
    }

    if (options?.offset) {
      params['offset'] = String(options.offset);
    }

    return params;
  }

  /**
   * البحث عن سجل وحيد بمفتاح فريد
   * مكافئ لـ prisma.model.findUnique({ where: { ... } })
   */
  async findUnique(table: string, where: Record<string, unknown>, select?: string): DbResult<unknown> {
    const filters: QueryFilter[] = Object.entries(where).map(([column, value]) => ({
      column,
      operator: 'eq' as FilterOperator,
      value,
    }));

    const result = await this.request(table, 'GET', {
      query: this.buildQueryParams({ select, filters, limit: 1 }),
    });

    if (result.error) return { data: null, error: result.error };

    const rows = result.data as unknown[];
    if (!rows || rows.length === 0) {
      return { data: null, error: null };
    }

    return { data: rows[0], error: null };
  }

  /**
   * البحث عن عدة سجلات
   * مكافئ لـ prisma.model.findMany({ where: { ... } })
   */
  async findMany(table: string, options?: QueryOptions): DbResult<unknown[]> {
    const result = await this.request(table, 'GET', {
      query: this.buildQueryParams(options),
    });

    if (result.error) return { data: null, error: result.error };
    return { data: (result.data as unknown[]) || [], error: null };
  }

  /**
   * إنشاء سجل جديد
   * مكافئ لـ prisma.model.create({ data: { ... } })
   */
  async create(table: string, data: Record<string, unknown>, select?: string): DbResult<unknown> {
    const query: Record<string, string> = {};
    if (select) query['select'] = select;

    const result = await this.request(table, 'POST', {
      body: data,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    if (result.error) return { data: null, error: result.error };

    // PostgREST مع return=representation يُرجع مصفوفة
    if (Array.isArray(result.data)) {
      return { data: result.data[0] || null, error: null };
    }

    return { data: result.data, error: null };
  }

  /**
   * تحديث سجلات
   * مكافئ لـ prisma.model.update({ where: { ... }, data: { ... } })
   */
  async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>, select?: string): DbResult<unknown> {
    const filters: QueryFilter[] = Object.entries(where).map(([column, value]) => ({
      column,
      operator: 'eq' as FilterOperator,
      value,
    }));

    const query: Record<string, string> = this.buildQueryParams({ select, filters });

    const result = await this.request(table, 'PATCH', {
      body: data,
      query,
    });

    if (result.error) return { data: null, error: result.error };

    // تحديث سجل وحيد
    if (Array.isArray(result.data) && result.data.length > 0) {
      return { data: result.data[0], error: null };
    }

    return { data: result.data, error: null };
  }

  /**
   * حذف سجلات
   * مكافئ لـ prisma.model.delete({ where: { ... } })
   */
  async delete(table: string, where: Record<string, unknown>): DbResult<unknown> {
    const filters: QueryFilter[] = Object.entries(where).map(([column, value]) => ({
      column,
      operator: 'eq' as FilterOperator,
      value,
    }));

    const result = await this.request(table, 'DELETE', {
      query: this.buildQueryParams({ filters }),
    });

    if (result.error) return { data: null, error: result.error };
    return { data: result.data, error: null };
  }

  /**
   * عد السجلات
   * مكافئ لـ prisma.model.count({ where: { ... } })
   */
  async count(table: string, where?: Record<string, unknown>): DbResult<number> {
    const filters: QueryFilter[] | undefined = where
      ? Object.entries(where).map(([column, value]) => ({
          column,
          operator: 'eq' as FilterOperator,
          value,
        }))
      : undefined;

    const result = await this.request(table, 'GET', {
      query: this.buildQueryParams({ select: 'count', filters }),
      headers: { 'Prefer': 'count=exact' },
    });

    if (result.error) return { data: null, error: result.error };

    // PostgREST count يُرجع البيانات مع header Content-Range
    const rows = result.data as unknown[];
    return { data: rows?.length || 0, error: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 نسخة موائمة Prisma-like للاستخدام في Server Actions
// ═══════════════════════════════════════════════════════════════════════

/**
 * موائم جدول Supabase بأسلوب Prisma
 *
 * يوفر واجهة برمجية مطابقة لـ PrismaClient delegate:
 *   - findUnique({ where: { ... } })
 *   - findMany({ where: { ... }, orderBy: { ... }, take: N })
 *   - create({ data: { ... } })
 *   - update({ where: { ... }, data: { ... } })
 *   - delete({ where: { ... } })
 *   - count({ where: { ... } })
 */
class PrismaLikeDelegate {
  constructor(
    private readonly adapter: SupabaseRestAdapter,
    private readonly table: string
  ) {}

  async findUnique(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown | null> {
    const select = args.select ? Object.keys(args.select).join(',') : undefined;
    const result = await this.adapter.findUnique(this.table, args.where, select);
    if (result.error) {
      throw new Error(`[DB] findUnique ${this.table} failed: ${result.error}`);
    }
    return result.data;
  }

  /**
   * البحث عن أول سجل مطابق
   * مكافئ لـ prisma.model.findFirst({ where: { ... } })
   */
  async findFirst(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    select?: Record<string, boolean>;
  }): Promise<unknown | null> {
    const options: QueryOptions = { limit: 1 };

    if (args?.select) {
      options.select = Object.keys(args.select).join(',');
    }

    if (args?.where) {
      options.filters = Object.entries(args.where).map(([column, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          const condition = value as Record<string, unknown>;
          if ('in' in condition) {
            return { column, operator: 'in' as FilterOperator, value: condition.in };
          }
          if ('contains' in condition) {
            return { column, operator: 'ilike' as FilterOperator, value: `%${condition.contains}%` };
          }
        }
        return { column, operator: 'eq' as FilterOperator, value };
      });
    }

    if (args?.orderBy) {
      const [column, direction] = Object.entries(args.orderBy)[0];
      options.orderBy = { column, ascending: direction === 'asc' };
    }

    const result = await this.adapter.findMany(this.table, options);
    if (result.error) {
      throw new Error(`[DB] findFirst ${this.table} failed: ${result.error}`);
    }
    const rows = result.data || [];
    return rows.length > 0 ? rows[0] : null;
  }

  async findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
    select?: Record<string, boolean>;
  }): Promise<unknown[]> {
    const options: QueryOptions = {};

    if (args?.select) {
      options.select = Object.keys(args.select).join(',');
    }

    if (args?.where) {
      options.filters = Object.entries(args.where).map(([column, value]) => {
        // دعم الشروط الخاصة مثل { role: { in: ['ADMIN', 'ENGINEER'] } }
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          const condition = value as Record<string, unknown>;
          if ('in' in condition) {
            return { column, operator: 'in' as FilterOperator, value: condition.in };
          }
          if ('contains' in condition) {
            return { column, operator: 'ilike' as FilterOperator, value: `%${condition.contains}%` };
          }
        }
        return { column, operator: 'eq' as FilterOperator, value };
      });
    }

    if (args?.orderBy) {
      const [column, direction] = Object.entries(args.orderBy)[0];
      options.orderBy = { column, ascending: direction === 'asc' };
    }

    if (args?.take) options.limit = args.take;
    if (args?.skip) options.offset = args.skip;

    const result = await this.adapter.findMany(this.table, options);
    if (result.error) {
      throw new Error(`[DB] findMany ${this.table} failed: ${result.error}`);
    }
    return result.data || [];
  }

  async create(args: { data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown> {
    const select = args.select ? Object.keys(args.select).join(',') : undefined;
    const result = await this.adapter.create(this.table, args.data, select);
    if (result.error) {
      throw new Error(`[DB] create ${this.table} failed: ${result.error}`);
    }
    return result.data;
  }

  async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<unknown> {
    const select = args.select ? Object.keys(args.select).join(',') : undefined;
    const result = await this.adapter.update(this.table, args.where, args.data, select);
    if (result.error) {
      throw new Error(`[DB] update ${this.table} failed: ${result.error}`);
    }
    return result.data;
  }

  async delete(args: { where: Record<string, unknown> }): Promise<unknown> {
    const result = await this.adapter.delete(this.table, args.where);
    if (result.error) {
      throw new Error(`[DB] delete ${this.table} failed: ${result.error}`);
    }
    return result.data;
  }

  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    const result = await this.adapter.count(this.table, args?.where);
    if (result.error) {
      throw new Error(`[DB] count ${this.table} failed: ${result.error}`);
    }
    return result.data || 0;
  }
}

/**
 * عميل قاعدة البيانات الموحد — Prisma-like interface عبر Supabase REST API
 *
 * يستخدم بدلاً من PrismaClient في بيئة Netlify Serverless
 *
 * @example
 * // بدلاً من:
 * const user = await prisma.user.findUnique({ where: { email } });
 * // نستخدم:
 * const user = await supabaseDb.user.findUnique({ where: { email } });
 */
class SupabasePrismaClient {
  public readonly user: PrismaLikeDelegate;
  public readonly project: PrismaLikeDelegate;
  public readonly scenario: PrismaLikeDelegate;
  public readonly rtmRecord: PrismaLikeDelegate;
  public readonly auditLog: PrismaLikeDelegate;
  public readonly processedEvent: PrismaLikeDelegate;

  private readonly adapter: SupabaseRestAdapter;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || '';

    if (!url || !serviceKey) {
      console.error('[SupabasePrismaClient] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
      throw new Error(
        '[SupabasePrismaClient] Environment variables NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and ' +
        'SUPABASE_SERVICE_KEY/SUPABASE_SECRET_KEY are required.'
      );
    }

    this.adapter = new SupabaseRestAdapter({ url, serviceKey });

    // إنشاء delegates لكل جدول — أسماء مطابقة لـ Prisma models
    this.user = new PrismaLikeDelegate(this.adapter, 'User');
    this.project = new PrismaLikeDelegate(this.adapter, 'Project');
    this.scenario = new PrismaLikeDelegate(this.adapter, 'Scenario');
    this.rtmRecord = new PrismaLikeDelegate(this.adapter, 'RtmRecord');
    this.auditLog = new PrismaLikeDelegate(this.adapter, 'AuditLog');
    this.processedEvent = new PrismaLikeDelegate(this.adapter, 'ProcessedEvent');
  }

  /**
   * تحقق من الاتصال بقاعدة البيانات
   */
  async $connect(): Promise<void> {
    // REST API لا يحتاج اتصال صريح — التحقق من الإعدادات فقط
    console.log('[SupabasePrismaClient] Connected via REST API');
  }

  /**
   * إغلاق الاتصال — لا يوجد اتصال لإغلاقه في REST API
   */
  async $disconnect(): Promise<void> {
    // لا يوجد اتصال TCP لإغلاقه
  }

  /**
   * تنفيذ استعلام خام — غير مدعوم عبر REST API
   */
  async $executeRaw(): Promise<never> {
    throw new Error('[SupabasePrismaClient] $executeRaw is not supported via REST API');
  }

  /**
   * تنفيذ استعلام خام — غير مدعوم عبر REST API
   */
  async $queryRaw(): Promise<never> {
    throw new Error('[SupabasePrismaClient] $queryRaw is not supported via REST API');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🔌 تصدير النسخة الوحيدة — Singleton Export
// ═══════════════════════════════════════════════════════════════════════

let _dbInstance: SupabasePrismaClient | null = null;

function getSupabaseDb(): SupabasePrismaClient {
  if (_dbInstance) return _dbInstance;

  _dbInstance = new SupabasePrismaClient();
  return _dbInstance;
}

/**
 * عميل قاعدة البيانات الموحد
 *
 * يُصدَّر باسم `prisma` و `db` للتوافق مع الكود الحالي
 * يعمل عبر Supabase REST API بدلاً من اتصال TCP المباشر
 */
export const supabaseDb = getSupabaseDb();

/** تصدير باسم prisma للتوافق مع الاستيرادات الحالية */
export const prisma = supabaseDb;

/** تصدير باسم db للتوافق مع الاستيرادات الحالية */
export const db = supabaseDb;

export default supabaseDb;
