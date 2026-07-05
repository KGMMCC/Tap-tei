
-- 1) Column-level restriction: remove sensitive contact columns from anon SELECT
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, theme, is_active, created_at, updated_at)
  ON public.profiles TO anon;

-- Authenticated keeps full column access (RLS still restricts rows to owner/admin for sensitive reads via new policy below)
-- Drop the existing broad public policy and replace with a narrower one
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;

CREATE POLICY "Public can view active profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Safe RPC that returns a public profile including contact fields, by username.
--    SECURITY DEFINER so it can read contact columns even when caller (anon) lacks column privileges.
CREATE OR REPLACE FUNCTION public.get_public_profile_by_username(_username text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  contact_email text,
  phone text,
  address text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.cover_url,
         p.contact_email, p.phone, p.address, p.is_active
  FROM public.profiles p
  WHERE p.username = lower(_username) AND p.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_username(text) TO anon, authenticated;

-- 3) Lock down SECURITY DEFINER helpers from direct execution
-- handle_new_user is a trigger function; only the table owner needs to invoke it
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies. Revoke from public/anon; keep authenticated for RLS eval.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- tg_set_updated_at is a trigger function; revoke direct execute
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
