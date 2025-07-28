# 🚀 Sensa AI Edge Functions - Quick Deployment Reference

## Essential Commands

### 🔗 Project Setup
```bash
# Link to project
supabase link --project-ref okvdirskoukqnjzqsowb

# Check status
supabase status
```

### 🔐 Secrets Management
```bash
# Set secrets
supabase secrets set DATABASE_URL=https://okvdirskoukqnjzqsowb.supabase.co
supabase secrets set ANON_KEY=your_anon_key

# List secrets
supabase secrets list

# Remove secret
supabase secrets unset SECRET_NAME
```

### 🚀 Deployment
```bash
# Deploy single function (RECOMMENDED)
supabase functions deploy function-name --use-api

# Deploy with debug
supabase functions deploy function-name --use-api --debug

# List deployed functions
supabase functions list
```

### 🔧 Troubleshooting
```bash
# Kill stuck processes
taskkill /F /IM supabase.exe

# Update CLI
scoop update supabase

# Check version
supabase --version
```

## 📁 Required File Structure

### `deno.json`
```json
{
  "imports": {
    "https://deno.land/std@0.168.0/": "https://deno.land/std@0.168.0/",
    "https://esm.sh/@supabase/supabase-js@2": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### `index.ts` Template
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 🎯 Current Functions

| Function | URL | Status |
|----------|-----|--------|
| test-deploy | `/functions/v1/test-deploy` | ✅ ACTIVE |
| adk-agents | `/functions/v1/adk-agents` | ✅ ACTIVE |
| mermaid-cartographer | `/functions/v1/mermaid-cartographer` | ✅ ACTIVE |
| send-auth-email | `/functions/v1/send-auth-email` | ✅ ACTIVE |

## ⚡ Key Success Factors

1. **Use `--use-api` flag** (not Docker)
2. **Update CLI to 2.26.9+**
3. **Set secrets BEFORE deployment**
4. **Embed CORS headers** in code
5. **Proper `deno.json` configuration**

---
*Base URL: `https://okvdirskoukqnjzqsowb.supabase.co`* 