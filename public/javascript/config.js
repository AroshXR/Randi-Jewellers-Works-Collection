// Supabase Configuration
const SUPABASE_URL = 'https://edwtsxkpiyqqrtkqqanf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkd3RzeGtwaXlxcXJ0a3FxYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjAxMDYsImV4cCI6MjA5NTEzNjEwNn0.dlC1jR8Rmmh82FpJrGyn9P31a8on6Z4VM_h-F8Z3ndw';

// Initialize Supabase Client globally
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
