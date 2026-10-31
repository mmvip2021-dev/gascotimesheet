-- جدولة التذكير كل 10 دقائق (مطبّقة بالفعل). السر يُقرأ من جدول push_config ولا يظهر هنا.
select cron.schedule('att-reminders', '*/10 * * * *', $$select net.http_post(
  url := 'https://gdfbnelcizvxcvlffnrl.supabase.co/functions/v1/att-reminders',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from public.push_config where key='cron_secret')),
  body := '{}'::jsonb)$$);
