import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface AuthEmailRequest {
  emailType: 'CONFIRM_SIGNUP' | 'RESET_PASSWORD' | 'INVITE_USER' | 'MAGIC_LINK' | 'CHANGE_EMAIL' | 'REAUTHENTICATION';
  userData: {
    email: string;
    password?: string;
    newEmail?: string;
    fullName?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emailType, userData }: AuthEmailRequest = await req.json()
    const { email, password, newEmail, fullName } = userData

    // Use the SERVICE_ROLE_KEY for admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Define the base URL for redirects
    const redirectBaseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    switch (emailType) {
      case 'CONFIRM_SIGNUP': {
        if (!email || !password) {
          throw new Error('Email and password are required for signup')
        }

        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
          email,
          password,
          options: {
            // Redirect to login page after email confirmation
            emailRedirectTo: `${redirectBaseUrl}/login?confirmed=true`,
            data: {
              full_name: fullName || null,
            }
          }
        })

        if (signUpError) throw signUpError

        // Create user profile in the users table
        if (signUpData.user) {
          const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
              auth_id: signUpData.user.id,
              email: signUpData.user.email!,
              full_name: fullName || null,
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't throw here as the user was created successfully
          }
        }

        return new Response(
          JSON.stringify({
            message: 'Signup successful. Please check your email to confirm your account.',
            user: signUpData.user,
            session: signUpData.session
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
        break;
      }

      case 'RESET_PASSWORD': {
        if (!email) {
          throw new Error('Email is required for password reset')
        }

        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${redirectBaseUrl}/update-password`
        })

        if (resetError) throw resetError

        return new Response(
          JSON.stringify({
            message: 'Password reset email sent. Please check your inbox.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        break;
      }

      case 'INVITE_USER': {
        if (!email) {
          throw new Error('Email is required for user invitation')
        }

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${redirectBaseUrl}/accept-invite`
        })

        if (inviteError) throw inviteError

        return new Response(
          JSON.stringify({
            message: 'Invitation sent successfully.',
            user: inviteData.user
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        break;
      }

      case 'MAGIC_LINK': {
        if (!email) {
          throw new Error('Email is required for magic link')
        }

        const { error: magicLinkError } = await supabaseAdmin.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${redirectBaseUrl}/dashboard`
          }
        })

        if (magicLinkError) throw magicLinkError

        return new Response(
          JSON.stringify({
            message: 'Magic link sent. Please check your email.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        break;
      }

      case 'CHANGE_EMAIL': {
        if (!newEmail) {
          throw new Error('New email is required for email change')
        }

        // This would typically be called from an authenticated context
        // For now, we'll return a message indicating the process
        return new Response(
          JSON.stringify({
            message: 'Email change process initiated. This requires user authentication.',
            instructions: 'Use supabase.auth.updateUser({ email: newEmail }) from authenticated client'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        break;
      }

      case 'REAUTHENTICATION': {
        return new Response(
          JSON.stringify({
            message: 'Reauthentication process initiated.',
            instructions: 'Use supabase.auth.reauthenticate() from authenticated client'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          { 
            status: 400, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
    }

  } catch (error) {
    console.error('Auth email error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process authentication email'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})