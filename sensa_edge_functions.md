# Sensa AI - Edge Functions Setup Guide

This document provides all the Edge Functions required for your Sensa AI application. Create these functions in your new Supabase project.

## 1. Shared CORS Utility

**File:** `supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

## 2. Authentication Email Function

**File:** `supabase/functions/send-auth-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
      case 'CONFIRM_SIGNUP':
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

      case 'RESET_PASSWORD':
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

      case 'INVITE_USER':
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

      case 'MAGIC_LINK':
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

      case 'CHANGE_EMAIL':
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

      case 'REAUTHENTICATION':
        return new Response(
          JSON.stringify({
            message: 'Reauthentication process initiated.',
            instructions: 'Use supabase.auth.reauthenticate() from authenticated client'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

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
```

## 3. Mermaid Cartographer Function (Optional)

**File:** `supabase/functions/mermaid-cartographer/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CartographerRequest {
  field_of_study: string;
  course_syllabus: string[];
  exam_scope: string[];
  user_memory_profile: {
    memories: Array<{
      category: string;
      text: string;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { field_of_study, course_syllabus, exam_scope, user_memory_profile }: CartographerRequest = await req.json()

    // Generate a mock study map (replace with actual AI implementation)
    const mockStudyMap = {
      mermaid_code: `mindmap
  root((🎯 ${field_of_study}))
    📚 Foundations
      Core Concepts
      Basic Principles
      ${course_syllabus[0] || 'Theory'}
    ⚡ Applications  
      Practical Skills
      ${course_syllabus[1] || 'Methods'}
      Real-world Use
    🔬 Advanced
      ${course_syllabus[2] || 'Research'}
      Specialized Topics
      Future Trends
    📊 Assessment
      Key Evaluations
      ${exam_scope[0] || 'Practice'}
      Mastery Check`,
      node_data: {
        'Core Concepts': {
          node_name: 'Core Concepts',
          sensa_insight: {
            analogy: `Think of ${field_of_study} core concepts like the foundation of a house - everything else builds on top`,
            study_tip: 'Master these fundamentals first, as they appear in every advanced topic'
          }
        }
      },
      legend_html: `
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 rounded-full" style="background-color: #6B46C1;"></div>
            <span class="text-sm text-gray-700">Central Topic - Main subject area</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 rounded-full" style="background-color: #F97316;"></div>
            <span class="text-sm text-gray-700">Major Branches - Key learning areas</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 rounded-full" style="background-color: #F59E0B;"></div>
            <span class="text-sm text-gray-700">Sub-topics - Detailed concepts</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 rounded-full" style="background-color: #EAB308;"></div>
            <span class="text-sm text-gray-700">Specific Skills - Actionable learning points</span>
          </div>
        </div>
      `
    }

    return new Response(
      JSON.stringify(mockStudyMap),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Mermaid cartographer error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate study map'
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
```

## 4. ADK Agents Integration Function (Future)

**File:** `supabase/functions/adk-agents/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface ADKRequest {
  agent_type: 'memory_analysis' | 'course_intel' | 'personalization' | 'career_pathway' | 'study_map' | 'orchestrator';
  payload: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent_type, payload }: ADKRequest = await req.json()

    // This would connect to your deployed ADK agents
    // For now, return a mock response
    const mockResponse = {
      agent: agent_type,
      result: {
        status: 'success',
        data: {
          message: `Mock response from ${agent_type} agent`,
          timestamp: new Date().toISOString(),
          payload_received: payload
        }
      }
    }

    return new Response(
      JSON.stringify(mockResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('ADK agents error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process ADK request'
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
```

## 5. Deployment Instructions

### Create the functions in your Supabase project:

1. **Using Supabase CLI:**
   ```bash
   # Initialize Supabase (if not already done)
   supabase init

   # Create the shared CORS file
   mkdir -p supabase/functions/_shared
   echo 'export const corsHeaders = { ... }' > supabase/functions/_shared/cors.ts

   # Create each function
   supabase functions new send-auth-email
   supabase functions new mermaid-cartographer
   supabase functions new adk-agents

   # Deploy all functions
   supabase functions deploy send-auth-email
   supabase functions deploy mermaid-cartographer
   supabase functions deploy adk-agents
   ```

2. **Using Supabase Dashboard:**
   - Go to your project dashboard
   - Navigate to "Edge Functions"
   - Click "Create Function"
   - Copy and paste each function code
   - Deploy

### Environment Variables Required:

Set these in your Supabase project settings:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SITE_URL=your_frontend_url  # e.g., https://your-app.vercel.app
```

### Testing the Functions:

Test each function using curl or your preferred HTTP client:

```bash
# Test auth email function
curl -X POST 'https://your-project.supabase.co/functions/v1/send-auth-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "emailType": "CONFIRM_SIGNUP",
    "userData": {
      "email": "test@example.com",
      "password": "password123",
      "fullName": "Test User"
    }
  }'
```

## 6. Security Considerations

1. **Environment Variables:** Ensure all sensitive keys are stored as environment variables
2. **CORS:** Adjust CORS headers to match your domain in production
3. **Rate Limiting:** Consider implementing rate limiting for auth endpoints
4. **Input Validation:** Add proper input validation for all function parameters
5. **Error Handling:** Ensure no sensitive information is leaked in error messages

## 7. Integration with Frontend

Update your frontend configuration to use these functions:

```typescript
// In your Supabase client configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Call functions like this:
const { data, error } = await supabase.functions.invoke('send-auth-email', {
  body: {
    emailType: 'CONFIRM_SIGNUP',
    userData: { email, password, fullName }
  }
})
```

This setup provides a complete foundation for your Sensa AI Edge Functions that can be easily deployed to your new Supabase project. 