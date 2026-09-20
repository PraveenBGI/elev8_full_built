# One-time test seed: a country + a Country Admin

**This is not a migration.** It doesn't go in `supabase/migrations/` because
it references one specific real person's Supabase Auth account -- running
it in every environment/country deployment would be wrong. Run it once,
by hand, in the Supabase SQL Editor, against your own project.

## Prerequisite: create a Supabase Auth user

There's no signup UI yet (Phase 2 is still blocked -- see
`00-MASTER-PLAN.md` sec 4). Create a user directly:

Supabase Dashboard → **Authentication → Users → Add user** → set an email
and password directly (not "Send invite," unless you also want to handle
the email step). Note the email you used.

## Seed SQL

Run this in Supabase Dashboard → **SQL Editor**, replacing
`YOUR_EMAIL_HERE` with the exact email of the user you just created:

```sql
do $$
declare
  v_user_id uuid;
  v_country_id uuid;
begin
  select id into v_user_id from auth.users where email = 'YOUR_EMAIL_HERE';

  if v_user_id is null then
    raise exception 'No auth user found with that email. Create one in Authentication -> Users first.';
  end if;

  insert into countries (name, master_currency, dial_code, official_language, approval_status)
  values ('Oman', 'OMR', '+968', 'Arabic', 'draft')
  returning id into v_country_id;

  insert into config_admin_roles (user_id, role, country_id)
  values (v_user_id, 'country_admin', v_country_id);

  raise notice 'Done. Country id: %, assigned to user id: %', v_country_id, v_user_id;
end $$;
```

## Then

1. Go to `https://<your-vercel-url>/login`, sign in with that email/password.
2. You'll land wherever the login page redirects (currently
   `/admin/config-engine/identity` directly).
3. You should see the Country Identity form pre-filled with "Oman" and be
   able to edit and save it.

## To remove this test data later

```sql
delete from config_admin_roles where country_id = (select id from countries where name = 'Oman' and master_currency = 'OMR');
delete from countries where name = 'Oman' and master_currency = 'OMR';
```

(Adjust the `where` clause if you've since created a real Oman row you don't
want to delete -- this is written assuming this seed's Oman row is the only
one.)
