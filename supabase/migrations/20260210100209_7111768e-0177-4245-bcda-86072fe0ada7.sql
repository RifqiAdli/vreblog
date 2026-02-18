
-- Add unique constraint on webhooks.name for upsert to work  
ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_name_key UNIQUE (name);
