-- =========================================
-- Admin Sync Logs
-- =========================================

CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL, -- e.g., 'NEWS', 'PLACES'
    status TEXT NOT NULL, -- e.g., 'SUCCESS', 'ERROR'
    message TEXT,
    items_added INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view logs
CREATE POLICY "Admins can view sync logs"
ON public.sync_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: Service roles (backend scripts) can insert logs automatically bypassing RLS.
