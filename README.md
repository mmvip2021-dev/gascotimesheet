# لقطة LOQTA

متجر إسكندراني (PWA) بـ HTML + Tailwind + Supabase. يومك لقطة مع لقطة.

## الملفات
- `index.html` الرئيسية، `product.html?id=...` صفحة المنتج، `admin.html` لوحة التحكم
- `config.js` بيانات Supabase (الـ anon key عام بطبيعته، والحماية من RLS)
- `data.js` طبقة البيانات، `sw.js` و`manifest.json` و`pwa.js` للـ PWA
- `supabase/` ملفات الـ SQL بالترتيب (مشغّلة فعلاً على المشروع `loqta`)

## النشر على Vercel
اربط الريبو بـ Vercel (Framework Preset: Other، بدون Build Command). كل push بينزل تلقائياً.

## أول مرة: اعمل نفسك أدمن
1. Supabase > Authentication > Users > Add user (إيميلك + كلمة سر قوية، Auto Confirm).
2. SQL Editor:
   update profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
3. افتح `/admin.html` وسجّل دخول.

## ملاحظات
- لا تحط `service_role` key في أي ملف هنا.
- الطلبات والسلة لسه مش متوصلة.
