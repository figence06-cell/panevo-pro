-- Create site settings table for maintenance mode
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Allow anonymous users to read maintenance mode only
CREATE POLICY "Anyone can check maintenance mode"
ON public.site_settings
FOR SELECT
TO anon
USING (key = 'maintenance_mode');

-- Allow authenticated non-admins to check maintenance mode
CREATE POLICY "Authenticated users can check maintenance mode"
ON public.site_settings
FOR SELECT
TO authenticated
USING (key = 'maintenance_mode');

-- Insert default maintenance mode setting
INSERT INTO public.site_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "Site bakımda. Lütfen daha sonra tekrar deneyin."}'::jsonb);