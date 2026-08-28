
-- Backfill missing profiles and user_roles, and (re)create the auth trigger

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, name, email, plan)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
       u.email,
       CASE WHEN lower(u.email) = 'gonzales1999.pan@gmail.com' THEN 'vip'::public.plan_tier ELSE 'free'::public.plan_tier END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       CASE WHEN lower(u.email) = 'gonzales1999.pan@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;
