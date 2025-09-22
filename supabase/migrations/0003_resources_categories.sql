-- Content taxonomy and resources

-- 1) Enum for resource type and status
DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM ('article','modele','guide','outil','juridique','documentation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Categories
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text, -- lucide icon name or custom key
  description text,
  sort_index int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.resource_categories;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.resource_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Resources
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.resource_type NOT NULL,
  status public.resource_status NOT NULL DEFAULT 'draft',
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  content text, -- markdown or html
  category_id uuid REFERENCES public.resource_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_resources_updated_at ON public.resources;
CREATE TRIGGER set_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS and policies
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = uid AND p.role IN ('admin','employe'));
$$;

-- Categories: public read, admin/employe manage
DROP POLICY IF EXISTS cat_select ON public.resource_categories;
CREATE POLICY cat_select ON public.resource_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS cat_write_admin ON public.resource_categories;
CREATE POLICY cat_write_admin ON public.resource_categories FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Resources: public can read published, admin/employe manage; authors can edit own drafts
DROP POLICY IF EXISTS res_select ON public.resources;
CREATE POLICY res_select ON public.resources
FOR SELECT USING (
  status = 'published' AND (published_at IS NULL OR published_at <= now())
  OR public.is_admin(auth.uid())
  OR (author_id = auth.uid())
);

DROP POLICY IF EXISTS res_insert_admin ON public.resources;
CREATE POLICY res_insert_admin ON public.resources FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR author_id = auth.uid());

DROP POLICY IF EXISTS res_update_admin ON public.resources;
CREATE POLICY res_update_admin ON public.resources FOR UPDATE USING (public.is_admin(auth.uid()) OR author_id = auth.uid()) WITH CHECK (public.is_admin(auth.uid()) OR author_id = auth.uid());

DROP POLICY IF EXISTS res_delete_admin ON public.resources;
CREATE POLICY res_delete_admin ON public.resources FOR DELETE USING (public.is_admin(auth.uid()));

