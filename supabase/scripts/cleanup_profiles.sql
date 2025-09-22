-- Optional maintenance script for aligning public.profiles with app requirements.
-- Run manually in Supabase SQL editor if needed. This script aims to fix the
-- schema without dropping data. If conversion is impossible, it will RAISE NOTICE.

-- Ensure enum exists
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('visiteur','inscrit','payant','employe','admin','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- Ensure table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    RAISE NOTICE 'Table public.profiles is missing. Run migrations 0001 and 0002.';
  END IF;
END$$;

-- Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'visiteur';

-- Try to convert role from text if the column exists but is not of type app_role
DO $$
DECLARE col_type text; BEGIN
  SELECT atttypid::regtype::text INTO col_type
  FROM pg_attribute
  WHERE attrelid = 'public.profiles'::regclass AND attname = 'role' AND attnum > 0;

  IF col_type IS NULL THEN
    -- already added above
    NULL;
  ELSIF col_type <> 'public.app_role' THEN
    BEGIN
      ALTER TABLE public.profiles
        ALTER COLUMN role TYPE public.app_role
        USING lower(role)::public.app_role;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not convert profiles.role to enum. Set invalid values to a valid role then retry.';
    END;
  END IF;
END$$;

-- Recreate helpful index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_uniq ON public.profiles ((lower(email))) WHERE email IS NOT NULL;

-- Ensure triggers exist (redefine to be safe)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'avatar_url', NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- RLS and policies reassertion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role IN ('admin','employe'));
$$;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.enforce_role_change_privilege()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Modification du rôle interdite (réservée aux admin/employe)';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_role_changes ON public.profiles;
CREATE TRIGGER protect_role_changes BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_role_change_privilege();

-- If everything fails and the old table is truly invalid, you can drop and recreate manually:
-- DROP TABLE public.profiles CASCADE;  -- WARNING: destructive! backup first.
-- Then run migrations 0001 and 0002.

