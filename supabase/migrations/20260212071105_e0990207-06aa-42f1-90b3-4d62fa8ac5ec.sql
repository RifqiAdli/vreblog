-- Add foreign key from api_keys.user_id to profiles.id for join queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'api_keys_user_id_fkey'
  ) THEN
    ALTER TABLE public.api_keys
      ADD CONSTRAINT api_keys_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable realtime for api_request_logs (api_keys already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'api_request_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.api_request_logs;
  END IF;
END $$;