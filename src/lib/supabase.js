import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://xfvelntqapiivgklymzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdmVsbnRxYXBpaXZna2x5bXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzMwODMsImV4cCI6MjA5MzYwOTA4M30.fmY7CMRSLQ_QKvmamCL2EPx7kVBubtm6DbFZ1q8xsEk'
);
