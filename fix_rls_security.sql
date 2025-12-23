-- 1. Ensure 'role' column exists in profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN 
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user'; 
    END IF;
END $$;

-- 2. Migrate existing admins if 'is_admin' column exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN 
        UPDATE public.profiles SET role = 'admin' WHERE is_admin = true; 
    END IF;
END $$;

-- 3. Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Remove existing policies on categories if any
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Create policies for categories
-- Everyone can view
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT 
TO public 
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert categories" 
ON public.categories FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update categories" 
ON public.categories FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete categories" 
ON public.categories FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Secure other tables (drops, products) - DROP ALL EXISTING POLICIES FIRST

-- DROPS: Wipe all policies to ensure no insecure user_metadata references remain
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'drops') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.drops'; 
    END LOOP; 
END $$;

-- Viewable by everyone
CREATE POLICY "Public drops are viewable by everyone" 
ON public.drops FOR SELECT 
TO public 
USING (true);

-- Admin only modification
CREATE POLICY "Admins can insert drops" 
ON public.drops FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update drops" 
ON public.drops FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete drops" 
ON public.drops FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- PRODUCTS: Wipe all policies to ensure no insecure user_metadata references remain
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.products'; 
    END LOOP; 
END $$;

-- Viewable by everyone
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT 
TO public 
USING (true);

-- Admin only modification
CREATE POLICY "Admins can insert products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Fix "Function Search Path Mutable" Warnings
-- This block dynamically finds and secures the specific functions mentioned in warnings
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure as func_signature 
        FROM pg_proc 
        WHERE proname IN ('get_user_role', 'update_drop_status', 'update_updated_at_column')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public, pg_temp;';
    END LOOP;
END $$;
