import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const demoUserId = Deno.env.get('DEMO_USER_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!demoUserId || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Demo identity not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin
      .from('entries')
      .select('id, user_id, tags, cycle_day, created_at')
      .eq('user_id', demoUserId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ entries: data }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
