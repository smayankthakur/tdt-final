-- Footer "Get Daily Divine Insights" sign-ups. This table was created by hand
-- in production (README: `prisma migrate dev --name add_newsletter_subscriber`)
-- but the migration file was never committed, so a fresh database could not
-- replay the chain. IF NOT EXISTS keeps it harmless on the live database.

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
