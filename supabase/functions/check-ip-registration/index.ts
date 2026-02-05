 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const { role, action, reason, userId } = await req.json();
     
     // Get client IP from headers
     const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
       || req.headers.get('x-real-ip') 
       || req.headers.get('cf-connecting-ip')
       || 'unknown';
     
     console.log(`IP Registration check - IP: ${clientIP}, Role: ${role}, Action: ${action}`);
     
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
     
     if (action === 'check') {
       // Check if IP can register for this role
       const { data, error } = await supabase.rpc('can_ip_register', {
         p_ip_address: clientIP,
         p_role: role
       });
       
       if (error) {
         console.error('Error checking IP:', error);
         throw error;
       }
       
       console.log(`IP check result:`, data);
       
       return new Response(JSON.stringify(data), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
       
     } else if (action === 'register') {
       // Register IP after successful signup
       if (!userId) {
         throw new Error('User ID is required for registration');
       }
       
       const { error } = await supabase.rpc('register_ip_account', {
         p_ip_address: clientIP,
         p_user_id: userId,
         p_role: role
       });
       
       if (error) {
         console.error('Error registering IP:', error);
         throw error;
       }
       
       console.log(`IP registered successfully for user ${userId}`);
       
       return new Response(JSON.stringify({ success: true }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
       
     } else if (action === 'request_bypass') {
       // Create a bypass request
       const { error } = await supabase
         .from('ip_bypass_requests')
         .insert({
           ip_address: clientIP,
           requested_role: role,
           reason: reason || 'No reason provided'
         });
       
       if (error) {
         console.error('Error creating bypass request:', error);
         throw error;
       }
       
       console.log(`Bypass request created for IP ${clientIP}`);
       
       return new Response(JSON.stringify({ 
         success: true, 
         message: 'Bypass request submitted. Please wait for admin approval.' 
       }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
     
     throw new Error('Invalid action');
     
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Error in check-ip-registration:', errorMessage);
     return new Response(JSON.stringify({ 
       error: errorMessage,
       allowed: false 
     }), {
       status: 400,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });