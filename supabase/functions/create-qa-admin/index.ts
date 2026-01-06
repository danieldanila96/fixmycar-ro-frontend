import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const qaPassword = Deno.env.get('QA_ADMIN_PASSWORD')!;

    if (!qaPassword) {
      throw new Error('QA_ADMIN_PASSWORD secret not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const qaEmail = 'qa@fixmycar.ro';

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === qaEmail);

    let userId: string;

    if (existingUser) {
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: qaPassword }
      );
      if (updateError) throw updateError;
      userId = existingUser.id;
      console.log('Updated existing QA user password');
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: qaEmail,
        password: qaPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'QA Admin',
          user_type: 'customer'
        }
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      console.log('Created new QA user:', userId);
    }

    // Check if admin role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!existingRole) {
      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (roleError) throw roleError;
      console.log('Added admin role to QA user');
    } else {
      console.log('QA user already has admin role');
    }

    // Update profile name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: 'QA Admin' })
      .eq('user_id', userId);

    if (profileError) {
      console.log('Profile update note:', profileError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QA Admin user created/updated successfully',
        email: qaEmail,
        userId: userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating QA admin:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
