// Supabase frontend configuration. Publishable keys are safe for browser use with RLS enabled.
const SUPABASE_URL = "https://anynezlldhucjxzfqfbu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_viM62mddRAMXtljwg6jbYA_I89r-wB2";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
