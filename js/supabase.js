// Supabase frontend configuration. Publishable key is safe for browser use.
const SUPABASE_URL = "https://pflpjuroqeeeytwvycap.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tl06bUIKRdWXCZeqxsIUCA_zQ6emcWV";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
