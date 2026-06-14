/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔐 وحدة التشفير والمصادقة المستقلة — CryptoVault
 * ═══════════════════════════════════════════════════════════════════════
 *
 * محرك تشفير سيادي يعتمد على خوارزمية AES-256-GCM:
 *   - طول المفتاح: 256 بت (32 بايت)
 *   - طول المتجه الأولي (IV): 12 بايت (96 بت) — المعيار الأمثل لـ GCM
 *   - طول علامة المصادقة (Auth Tag): 16 بايت (128 بت)
 *
 * يتحقق تلقائياً من علامة المصادقة (Auth Tag) عند فك التشفير،
 * ويقذف خطأً حاداً (ERR-CRYPTO-INVALID-FORMAT) في حال أي تلاعب بالبيانات.
 *
 * البنية المُشفَّرة المشفَّرة بصيغة base64:
 *   [IV: 12 بايت][AUTH_TAG: 16 بايت][CIPHER_TEXT: N بايت]
 *
 * ⚠️ هذه الوحدة تعمل حصرياً على الخادم (Server-Side Only)
 * ⚠️ المفتاح يجب أن يُقرأ من متغيرات البيئة (ENCRYPTION_KEY)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** خوارزمية التشفير المستخدمة */
const ALGORITHM = 'aes-256-gcm';

/** طول المتجه الأولي (Initialization Vector) بالبايت */
const IV_LENGTH = 12;

/** طول علامة المصادقة (Authentication Tag) بالبايت */
const AUTH_TAG_LENGTH = 16;

/** طول مفتاح التشفير بالبايت (256 بت) */
const KEY_LENGTH = 32;

/** رسالة الخطأ عند فشل التحقق من سلامة البيانات */
const ERR_CRYPTO_INVALID_FORMAT = 'ERR-CRYPTO-INVALID-FORMAT';

/**
 * كلاس التشفير السيادي — CryptoVault
 *
 * تصميم معزول وقابل لاختبارات الوحدة (Unit-Testable):
 *   - يقبل المفتاح عبر المُنشئ (constructor) لتمكين الحقن في الاختبارات
 *   - لا يعتمد على أي حالة مشتركة (Stateless)
 *   - كل عملية تشفير تولد IV عشوائي جديداً
 */
export class CryptoVault {
  private readonly encryptionKey: Buffer;

  /**
   * إنشاء نسخة جديدة من CryptoVault
   *
   * @param keyHex - مفتاح التشفير بصيغة سداسية عشرية (64 حرف = 32 بايت)
   * @throws Error إذا كان المفتاح بطول غير صحيح
   *
   * @example
   * // في بيئة الإنتاج: يُقرأ من process.env.ENCRYPTION_KEY
   * const vault = new CryptoVault(process.env.ENCRYPTION_KEY!);
   *
   * // في بيئة الاختبار: يُولَّد مفتاح عشوائي
   * const testKey = randomBytes(32).toString('hex');
   * const testVault = new CryptoVault(testKey);
   */
  constructor(keyHex: string) {
    const keyBuffer = Buffer.from(keyHex, 'hex');

    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error(
        `[CryptoVault] مفتاح التشفير غير صالح: متوقع ${KEY_LENGTH} بايت، تم استلام ${keyBuffer.length} بايت. ` +
        `تأكد من توفير ENCRYPTION_KEY صحيح بصيغة hex (64 حرف).`
      );
    }

    this.encryptionKey = keyBuffer;
  }

  /**
   * تشفير نص صريح باستخدام AES-256-GCM
   *
   * العملية:
   *   1. توليد IV عشوائي (12 بايت)
   *   2. تشفير النص مع توليد علامة المصادقة (Auth Tag)
   *   3. دمج [IV + AUTH_TAG + CIPHER_TEXT] في buffer واحد
   *   4. ترميز النتيجة بصيغة base64
   *
   * @param plaintext - النص الصريح المراد تشفيره
   * @returns النص المشفر بصيغة base64
   */
  encrypt(plaintext: string): string {
    // ١. توليد متجه أولي عشوائي لكل عملية تشفير
    const iv = randomBytes(IV_LENGTH);

    // ٢. إنشاء مشفر GCM مع تحديد طول علامة المصادقة
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // ٣. تشفير النص الصريح
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // ٤. استخراج علامة المصادقة
    const authTag = cipher.getAuthTag();

    // ٥. دمج: [IV (12 بايت)] + [AUTH_TAG (16 بايت)] + [CIPHER_TEXT (N بايت)]
    const payload = Buffer.concat([iv, authTag, encrypted]);

    // ٦. ترميز النتيجة بصيغة base64
    return payload.toString('base64');
  }

  /**
   * فك تشفير نص مشفر باستخدام AES-256-GCM مع التحقق من علامة المصادقة
   *
   * العملية:
   *   1. فك ترميز base64
   *   2. استخراج IV (أول 12 بايت)
   *   3. استخراج علامة المصادقة (الـ 16 بايت التالية)
   *   4. استخراج النص المشفر (الباقي)
   *   5. فك التشفير مع التحقق التلقائي من Auth Tag
   *   6. في حال أي تلاعب → يقذف ERR-CRYPTO-INVALID-FORMAT
   *
   * @param encryptedBase64 - النص المشفر بصيغة base64
   * @returns النص الصريح الأصلي
   * @throws Error مع رمز ERR-CRYPTO-INVALID-FORMAT عند أي تلاعب أو فساد
   */
  decrypt(encryptedBase64: string): string {
    try {
      // ١. فك ترميز base64
      const payload = Buffer.from(encryptedBase64, 'base64');

      // ٢. التحقق من الحد الأدنى لطول البيانات (IV + AUTH_TAG = 28 بايت كحد أدنى)
      if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error(
          `[CryptoVault] بيانات مشفرة غير صالحة: الطول (${payload.length}) أقل من الحد الأدنى (${IV_LENGTH + AUTH_TAG_LENGTH}).`
        );
      }

      // ٣. استخراج الأجزاء
      const iv = payload.subarray(0, IV_LENGTH);
      const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const cipherText = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      // ٤. إنشاء مفك تشفير GCM
      const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });

      // ٥. تعيين علامة المصادقة للتحقق
      decipher.setAuthTag(authTag);

      // ٦. فك التشفير مع التحقق التلقائي من سلامة البيانات
      const decrypted = Buffer.concat([
        decipher.update(cipherText),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error: unknown) {
      // أي خطأ في فك التشفير (بما في ذلك فشل Auth Tag) يُعتبر تلاعباً بالبيانات
      const message =
        error instanceof Error ? error.message : 'خطأ غير معروف في فك التشفير';

      throw new Error(
        `[${ERR_CRYPTO_INVALID_FORMAT}] فشل التحقق من سلامة البيانات المشفرة. ` +
        `السبب: ${message}. ` +
        `هذا يشير إلى تلاعب محتمل بالبيانات أو تلف في التخزين.`
      );
    }
  }
}

/**
 * إنشاء نسخة وحيدة (Singleton) من CryptoVault
 *
 * تقرأ المفتاح من متغير البيئة ENCRYPTION_KEY.
 * في بيئة التطوير، إذا لم يُوجد المفتاح، يُولَّد واحد مؤقت مع تحذير.
 *
 * ⚠️ في الإنتاج: يجب تعيين ENCRYPTION_KEY صراحةً وإلا سيفشل التطبيق
 * ⚠️ في Netlify Serverless: يتم إعادة إنشاء النسخة لكل invocation
 *    لأن الـ global state لا يتشارك بين invocations
 */
let _vaultInstance: CryptoVault | null = null;

export function getCryptoVault(): CryptoVault {
  // في serverless، نعيد استخدام النسخة داخل نفس الـ invocation
  if (_vaultInstance) return _vaultInstance;

  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[CryptoVault] ENCRYPTION_KEY غير معرَّف في بيئة الإنتاج! ' +
        'يجب تعيين متغير البيئة ENCRYPTION_KEY بصيغة hex (64 حرف). ' +
        'على Netlify: Site settings → Environment variables → ENCRYPTION_KEY'
      );
    }

    // في التطوير: توليد مفتاح مؤقت (سيُفقد عند إعادة التشغيل)
    console.warn(
      '[CryptoVault] ⚠️ ENCRYPTION_KEY غير معرَّف. تم توليد مفتاح مؤقت لأغراض التطوير فقط. ' +
      'لا تستخدم هذا في الإنتاج!'
    );

    const devKey = randomBytes(KEY_LENGTH).toString('hex');
    _vaultInstance = new CryptoVault(devKey);
    return _vaultInstance;
  }

  // التحقق من طول المفتاح قبل إنشاء النسخة
  if (keyHex.length !== 64) {
    throw new Error(
      `[CryptoVault] ENCRYPTION_KEY بطول غير صحيح: متوقع 64 حرف hex، تم استلام ${keyHex.length} حرف. ` +
      'لتوليد مفتاح: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  _vaultInstance = new CryptoVault(keyHex);
  return _vaultInstance;
}

/**
 * إعادة تعيين النسخة — للاستخدام في الاختبارات فقط
 */
export function resetCryptoVault(): void {
  _vaultInstance = null;
}
