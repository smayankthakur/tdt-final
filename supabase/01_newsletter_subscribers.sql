-- Footer "Get Daily Divine Insights" sign-ups (email + optional WhatsApp).
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'subscribed',      -- subscribed | unsubscribed
  source TEXT DEFAULT 'website',                   -- where the signup came from
  locale TEXT,                                     -- en | hi | hinglish (if known)
  ip_hash TEXT,                                    -- optional, privacy-preserving
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(lower(email));
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON public.newsletter_subscribers(created_at DESC);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
