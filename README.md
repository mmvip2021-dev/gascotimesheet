# داشبورد الحضور الشهري – صان مصر

موقع ثابت (ملف واحد `index.html`) مربوط بـ Supabase للحفظ السحابي والمزامنة اللحظية بين الأجهزة.
البيانات تُحفظ على الجهاز (localStorage) وعلى السيرفر معًا، ولو الإنترنت قطع يكمل الشغل محليًا ويرفع تلقائيًا بعد رجوعه.

## الرفع على GitHub
1. أنشئ مستودعًا جديدًا (Repository) على GitHub.
2. ارفع كل محتويات هذا المجلد (`index.html` و`config.js` و`vercel.json` و`supabase/`).

## النشر على Vercel
1. Vercel ← Add New ← Project ← اختر المستودع.
2. Framework Preset: **Other**، واترك Build Command وOutput Directory فاضيين.
3. Deploy. لا توجد متغيرات بيئة مطلوبة (الإعدادات في `config.js`).

## إعدادات Supabase (من لوحة التحكم)
- Authentication ← URL Configuration: ضع رابط Vercel في **Site URL** وأضفه في **Redirect URLs**.
- Authentication ← Providers: Email مفعّل، ويُفضَّل إبقاء تأكيد البريد شغّالًا.

## الحسابات والصلاحيات
- الحساب `mm.vip2021@gmail.com` يتفعّل تلقائيًا أول ما يسجّل.
- أي حساب آخر يسجّل ثم **ينتظر التفعيل**. لتفعيله: Supabase ← SQL Editor:
  `update public.profiles set is_active = true where email = 'name@example.com';`
- كل مستخدم يرى ويعدّل بياناته فقط.

## ملاحظات
- أول تسجيل دخول: لو حسابك على السيرفر فاضي تُرفع بيانات الجهاز، ولو فيه بيانات تُحمَّل منه.
- مفتاح `publishable` في `config.js` آمن للعرض؛ الحماية عبر RLS. لا تضع مفتاح `service_role` هنا أبدًا.
