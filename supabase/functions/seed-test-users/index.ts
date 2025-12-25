import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting seed-test-users function');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const testUsers = [];

    // Create test customer
    const customerEmail = 'testclient@fixmycar.ro';
    const customerPassword = 'Test123!';
    
    console.log('Creating test customer...');
    const { data: customerData, error: customerError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: customerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Ion Popescu',
        user_type: 'customer',
        phone: '0722123456'
      }
    });

    if (customerError) {
      if (customerError.message.includes('already been registered')) {
        console.log('Customer already exists');
        testUsers.push({
          type: 'customer',
          email: customerEmail,
          password: customerPassword,
          status: 'already exists'
        });
      } else {
        console.error('Error creating customer:', customerError);
        throw customerError;
      }
    } else {
      console.log('Customer created:', customerData.user?.id);
      testUsers.push({
        type: 'customer',
        email: customerEmail,
        password: customerPassword,
        userId: customerData.user?.id,
        status: 'created'
      });
    }

    // Create test garage
    const garageEmail = 'testservice@fixmycar.ro';
    const garagePassword = 'Test123!';
    
    console.log('Creating test garage...');
    const { data: garageData, error: garageError } = await supabase.auth.admin.createUser({
      email: garageEmail,
      password: garagePassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Mihai Ionescu',
        user_type: 'garage',
        phone: '0733456789'
      }
    });

    if (garageError) {
      if (garageError.message.includes('already been registered')) {
        console.log('Garage already exists');
        testUsers.push({
          type: 'garage',
          email: garageEmail,
          password: garagePassword,
          status: 'already exists'
        });
      } else {
        console.error('Error creating garage:', garageError);
        throw garageError;
      }
    } else {
      console.log('Garage created:', garageData.user?.id);
      
      // Update garage profile with business details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: 'Auto Service Pro',
          business_address: 'Strada Mecanicilor 42',
          city: 'București',
          county: 'București',
          description: 'Service auto complet cu experiență de peste 15 ani. Oferim reparații mecanice, electrice, ITP și diagnoză computerizată.',
          specialties: ['revizie', 'mecanica', 'electrica', 'itp', 'diagnoza'],
          latitude: 44.4268,
          longitude: 26.1025
        })
        .eq('user_id', garageData.user?.id);

      if (profileError) {
        console.error('Error updating garage profile:', profileError);
      } else {
        console.log('Garage profile updated');
      }

      testUsers.push({
        type: 'garage',
        email: garageEmail,
        password: garagePassword,
        userId: garageData.user?.id,
        businessName: 'Auto Service Pro',
        status: 'created'
      });
    }

    console.log('Test users seeding completed');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test users created successfully',
        users: testUsers
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in seed-test-users:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
