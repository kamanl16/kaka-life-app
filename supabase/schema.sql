-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create News Table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    link TEXT UNIQUE NOT NULL, -- UNIQUE ensures we don't insert duplicate RSS articles
    pub_date TIMESTAMP WITH TIME ZONE,
    content_snippet TEXT,
    image_url TEXT,
    source TEXT NOT NULL,
    category TEXT DEFAULT '本地', -- Store category like '本地' (Local)
    is_translated BOOLEAN DEFAULT true, -- Tracks if AI translation succeeded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MIGRATION: Add is_translated column if table exists
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_translated BOOLEAN DEFAULT true;

-- Set Row Level Security (RLS)
-- For now, anyone can read the news, but only authenticated admins/service roles can insert/update.
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on news" 
ON public.news
FOR SELECT 
USING (true);

-- Allow service role full access (This is default behavior, but good to be explicit in mental model)

-- Create Places Table (for Yelp Data)
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yelp_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    rating NUMERIC,
    reviews_count INTEGER,
    price_level TEXT,
    area TEXT,
    image_url TEXT,
    description TEXT,
    is_open BOOLEAN DEFAULT true,
    address TEXT,
    yelp_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on places" 
ON public.places
FOR SELECT 
USING (true);

-- MIGRATION: Add new columns if the table already exists
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS yelp_url TEXT;

-- =========================================
-- Phase 2: Profiles & Authentication
-- =========================================

-- Create Profiles Table (For User Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Phase 3: Classifieds (Life Info)
-- =========================================

CREATE TABLE IF NOT EXISTS public.classifieds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT,
    location TEXT,
    image_url TEXT,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for classifieds
ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classifieds" 
ON public.classifieds
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert classifieds" 
ON public.classifieds
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own classifieds or admins" 
ON public.classifieds
FOR UPDATE 
USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete own classifieds or admins" 
ON public.classifieds
FOR DELETE 
USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- =========================================
-- Phase 3: Storage Bucket Policies
-- =========================================

-- Allow anyone to view images
CREATE POLICY "Public Access to classifieds bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'classifieds');

-- Allow logged in users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'classifieds');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'classifieds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================
-- Phase 3.1: Classifieds Subcategories
-- =========================================

-- MIGRATION: Add subcategory column to existing classifieds table
ALTER TABLE public.classifieds ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- =========================================
-- Phase 4: Forum & Community
-- =========================================

-- 1. Create forum_posts table
CREATE TABLE public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create forum_comments table
CREATE TABLE public.forum_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for forum_posts
-- Read: Anyone can read
CREATE POLICY "Anyone can view forum posts"
ON public.forum_posts FOR SELECT
USING (true);

-- Insert: Authenticated users can create posts
CREATE POLICY "Authenticated users can create forum posts"
ON public.forum_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Delete: Users can delete their own posts
CREATE POLICY "Users can delete own forum posts"
ON public.forum_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Admin Delete: Admins can delete any post
CREATE POLICY "Admins can delete any forum post"
ON public.forum_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. RLS Policies for forum_comments
-- Read: Anyone can read
CREATE POLICY "Anyone can view forum comments"
ON public.forum_comments FOR SELECT
USING (true);

-- Insert: Authenticated users can create comments
CREATE POLICY "Authenticated users can create forum comments"
ON public.forum_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Delete: Users can delete their own comments
CREATE POLICY "Users can delete own forum comments"
ON public.forum_comments FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- Admin Delete: Admins can delete any comment
CREATE POLICY "Admins can delete any forum comment"
ON public.forum_comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
