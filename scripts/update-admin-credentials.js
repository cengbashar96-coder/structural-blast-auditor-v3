#!/usr/bin/env node
/**
 * سكريبت تحديث بيانات المدير في Supabase
 * =====================================
 * البريد الجديد:  cengbashar96@gmail.com
 * كلمة المرور:    REDACTED_ADMIN_PASSWORD
 *
 * طريقة التشغيل:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_KEY=sb_secret_xxx \
 *   node /home/z/my-project/scripts/update-admin-credentials.js
 *
 * أو عدّل المتغيرات أدناه مباشرة.
 */

const bcrypt = require('bcryptjs');

// ════════════════════════════════════════════════════════
// ⚙️ الإعدادات — يمكن تعديلها أو ضبطها عبر متغيرات البيئة
// ════════════════════════════════════════════════════════
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const OLD_EMAIL = 'abu-sulaiman@structural-blast.sy';
const NEW_EMAIL = 'cengbashar96@gmail.com';
const NEW_PASSWORD = process.env.ADMIN_PASSWORD || '';

// ════════════════════════════════════════════════════════
// 🔐 توليد bcrypt hash (12 جولة)
// ════════════════════════════════════════════════════════
const NEW_HASH = bcrypt.hashSync(NEW_PASSWORD, 12);

console.log('═══════════════════════════════════════════════════════');
console.log('  تحديث بيانات المدير في Supabase');
console.log('═══════════════════════════════════════════════════════');
console.log(`  Supabase URL : ${SUPABASE_URL}`);
console.log(`  البريد القديم: ${OLD_EMAIL}`);
console.log(`  البريد الجديد: ${NEW_EMAIL}`);
console.log(`  Hash الجديد  : ${NEW_HASH.substring(0, 25)}...`);
console.log('═══════════════════════════════════════════════════════\n');

// ════════════════════════════════════════════════════════
// 🚀 تنفيذ طلب PATCH على Supabase REST API
// ════════════════════════════════════════════════════════
async function updateAdmin() {
  const url = `${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(OLD_EMAIL)}`;
  const payload = JSON.stringify({
    email: NEW_EMAIL,
    passwordHash: NEW_HASH
  });

  console.log('▶ إرسال طلب PATCH إلى Supabase...');

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: payload
    });

    const status = response.status;
    const text = await response.text();

    console.log(`\n📊 HTTP Status: ${status}`);

    if (status === 200 || status === 204) {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          console.log('\n✅ تم التحديث بنجاح!');
          console.log('   - id         :', data[0].id);
          console.log('   - email      :', data[0].email);
          console.log('   - displayName:', data[0].displayName);
          console.log('   - role       :', data[0].role);
        } else if (text === '' || text === '[]') {
          console.log('\n⚠️  الاستجابة فارغة — تأكد من وجود حساب بالبريد القديم');
        }
      } catch {
        console.log('\n✅ تم التحديث (استجابة فارغة من الخادم)');
      }
    } else if (status === 0) {
      console.log('\n❌ فشل الاتصال — مشروع Supabase متوقف أو غير قابل للوصول');
      console.log('   → سجّل دخولك إلى https://supabase.com/dashboard لاستعادة المشروع');
    } else {
      console.log(`\n❌ فشل التحديث (HTTP ${status})`);
      console.log('   نص الاستجابة:', text);
      if (status === 401) console.log('   → مفتاح Supabase غير صالح');
      if (status === 404) console.log('   → عنوان URL غير صحيح أو المشروع محذوف');
    }
  } catch (err) {
    console.log('\n❌ خطأ في الشبكة:', err.message);
    if (err.cause?.code === 'ENOTFOUND') {
      console.log('   → DNS لا يستطيع حل اسم Supabase — المشروع متوقف على الأرجح');
    }
  }
}

updateAdmin().catch(console.error);
