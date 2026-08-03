-- Migration: 00001_auth_schema.sql
-- Description: Create roles table, extend user profiles, and setup RLS

-- 1. Create a roles table (Optional, but good for explicit RBAC)
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO public.roles (role_name) VALUES ('admin'), ('user');

-- 2. Create a users profile table that links to Supabase auth.users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id INT REFERENCES public.roles(id) DEFAULT 2, -- Default to 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Optional: Admins can read all profiles
-- CREATE POLICY "Admins can read all" ON public.user_profiles FOR SELECT
-- USING ( (SELECT role_name FROM public.roles WHERE id = public.user_profiles.role_id) = 'admin' );

-- 4. Trigger to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
