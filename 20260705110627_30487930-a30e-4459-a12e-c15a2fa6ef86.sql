
-- 1) Tighten profiles SELECT: only owners and admins may read rows directly.
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;

CREATE POLICY "Owners can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Anonymous role no longer has direct table access; public reads happen only via the security-definer RPC.
REVOKE SELECT ON public.profiles FROM anon;
-- Authenticated: reset then grant all columns; RLS restricts rows to own-only.
GRANT SELECT ON public.profiles TO authenticated;

-- 2) Helper for links public visibility (avoids anon needing SELECT on profiles).
CREATE OR REPLACE FUNCTION public.is_active_profile(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_profile(uuid) TO anon, authenticated;

-- 3) Rewrite links public policy to use the helper.
DROP POLICY IF EXISTS "Public can view links of active profiles" ON public.links;

CREATE POLICY "Public can view links of active profiles"
  ON public.links
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_active_profile(user_id)
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) Ensure the safe public-profile RPC is still callable only via RPC, not directly on the table.
--    (Already created previously; keep grants explicit.)
REVOKE ALL ON FUNCTION public.get_public_profile_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_username(text) TO anon, authenticated;
