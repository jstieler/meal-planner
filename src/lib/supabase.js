import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://rozpgjlemkekqrelpume.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvenBnamxlbWtla3FyZWxwdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjY2NzAsImV4cCI6MjA5MzY0MjY3MH0.5L8jOWaSyfn9AlvUA3A9yUzCJn2CS4oCSpHuemLaQ-A'
);
