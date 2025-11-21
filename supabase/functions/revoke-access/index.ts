import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevokeAccessRequest {
  colaboradorId: string;
  userId: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with user token to verify password
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { colaboradorId, userId, password }: RevokeAccessRequest = await req.json();

    console.log('Revoking access for:', { colaboradorId, userId });

    // Verify current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify password by attempting to re-authenticate
    const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (authError || !authData.user) {
      throw new Error('Senha incorreta');
    }

    // Delete user from auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError);
      throw deleteUserError;
    }

    // Clear user_id from colaborador
    const { error: updateError } = await supabaseAdmin
      .from('colaborador')
      .update({ user_id: null })
      .eq('id_colaborador', colaboradorId);

    if (updateError) {
      console.error('Error updating colaborador:', updateError);
      throw updateError;
    }

    // Delete user_roles entry (will cascade automatically)
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
      // Don't throw - user may have been already deleted
    }

    console.log('Access revoked successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Acesso removido com sucesso' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in revoke-access function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao revogar acesso',
        details: error.toString()
      }),
      {
        status: error.message === 'Senha incorreta' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
