-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role app_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id),
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  scheduled_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  reading_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'spam')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, user_id)
);

-- Bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, user_id)
);

-- Analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  device_type TEXT,
  browser TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shares table
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'discord' CHECK (type IN ('discord', 'slack', 'custom')),
  enabled BOOLEAN DEFAULT true,
  events TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter subscribers table
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Admins can view all user roles" ON public.user_roles
FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (public.is_admin());

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (public.is_admin());

-- Articles policies
CREATE POLICY "Published articles are viewable by everyone" ON public.articles
FOR SELECT USING (status = 'published' OR author_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authors can create articles" ON public.articles
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can update articles" ON public.articles
FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete articles" ON public.articles
FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- Comments policies
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments
FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authenticated users can create comments" ON public.comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users and admins can delete comments" ON public.comments
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.likes
FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their bookmarks" ON public.bookmarks
FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Anyone can insert analytics" ON public.analytics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics" ON public.analytics
FOR SELECT USING (public.is_admin());

-- Shares policies
CREATE POLICY "Anyone can insert shares" ON public.shares
FOR INSERT WITH CHECK (true);

CREATE POLICY "Shares are viewable by everyone" ON public.shares
FOR SELECT USING (true);

-- Settings policies
CREATE POLICY "Settings are viewable by everyone" ON public.settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.settings
FOR ALL USING (public.is_admin());

-- Webhooks policies
CREATE POLICY "Admins can manage webhooks" ON public.webhooks
FOR ALL USING (public.is_admin());

-- Subscribers policies
CREATE POLICY "Anyone can subscribe" ON public.subscribers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON public.subscribers
FOR SELECT USING (public.is_admin());

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update article reading time
CREATE OR REPLACE FUNCTION public.update_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.reading_time := GREATEST(1, CEIL(array_length(regexp_split_to_array(COALESCE(NEW.content, ''), '\s+'), 1)::numeric / 200));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger for reading time
CREATE TRIGGER update_article_reading_time
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_reading_time();

-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.articles SET views = views + 1 WHERE id = article_id;
END;
$$;

-- Enable realtime for comments and likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Articles about technology and software'),
('Lifestyle', 'lifestyle', 'Life, culture, and personal growth'),
('Business', 'business', 'Business strategies and entrepreneurship'),
('Design', 'design', 'UI/UX, graphic design, and visual arts'),
('Travel', 'travel', 'Travel guides and adventures');

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
('site', '{"title": "Modern Blog", "description": "A professional blog platform", "logo": null}'::jsonb),
('seo', '{"defaultTitle": "Modern Blog", "defaultDescription": "Discover amazing articles on our blog"}'::jsonb),
('social', '{"twitter": "", "facebook": "", "instagram": "", "linkedin": ""}'::jsonb);