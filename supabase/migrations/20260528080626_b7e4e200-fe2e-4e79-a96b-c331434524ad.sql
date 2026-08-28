UPDATE public.profiles SET plan='vip'::plan_tier WHERE email='gonzales1999.pan@gmail.com';
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email='gonzales1999.pan@gmail.com'
ON CONFLICT DO NOTHING;
DELETE FROM public.user_roles ur USING auth.users u
WHERE ur.user_id = u.id AND u.email='gonzales1999.pan@gmail.com' AND ur.role='user'::app_role;