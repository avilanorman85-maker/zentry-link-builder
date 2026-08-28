DROP POLICY IF EXISTS "admins manage codes" ON public.activation_codes;
CREATE POLICY "admins select codes" ON public.activation_codes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins insert codes" ON public.activation_codes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update codes" ON public.activation_codes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete codes" ON public.activation_codes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));