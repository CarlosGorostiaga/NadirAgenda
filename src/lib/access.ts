import { supabase } from './supabaseClient';

export async function checkAccess() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { logged: false, allowed: false };

  const { data } = await supabase
    .from('user_access')
    .select('access_until')
    .eq('user_id', user.id)
    .single();

  if (!data) return { logged: true, allowed: false };

  const allowed = new Date(data.access_until).getTime() > Date.now();

  return { logged: true, allowed };
}
