# Sensa AI Edge Functions Deployment Guide

## 📋 Prerequisites

### 1. Required Software
- **Supabase CLI** (v2.26.9 or later)
- **PowerShell** (Windows) or Terminal (Mac/Linux)
- **Git** (for version control)

### 2. Supabase Project Setup
- Project Reference: `okvdirskoukqnjzqsowb`
- Project URL: `https://okvdirskoukqnjzqsowb.supabase.co`

## 🚀 Deployment Process

### Step 1: Environment Setup

#### Install/Update Supabase CLI
```bash
# Windows (using Scoop)
scoop update supabase

# Verify version
supabase --version  # Should be 2.26.9+
```

#### Link to Supabase Project
```bash
supabase link --project-ref okvdirskoukqnjzqsowb
```

### Step 2: Configure Secrets

Set up environment variables for Edge Functions:

```bash
# Database connection
supabase secrets set DATABASE_URL=https://okvdirskoukqnjzqsowb.supabase.co

# Authentication keys
supabase secrets set ANON_KEY=your_anon_key_here

# Verify secrets
supabase secrets list
```

**Important Notes:**
- ❌ Don't use `SUPABASE_` prefix (blocked by Supabase)
- ❌ Don't use `NEXT_PUBLIC_` prefix (only for frontend)
- ✅ Use simple names like `DATABASE_URL`, `ANON_KEY`

### Step 3: Function Structure

Each function requires:

#### Directory Structure
```
supabase/functions/
├── _shared/           # Shared utilities (optional)
│   └── cors.ts
├── function-name/     # Individual function folder
│   ├── index.ts       # Main function code
│   └── deno.json      # Dependencies configuration
```

#### Required Files

**1. `deno.json` - Dependencies Configuration**
```json
{
  "imports": {
    "https://deno.land/std@0.168.0/": "https://deno.land/std@0.168.0/",
    "https://esm.sh/@supabase/supabase-js@2": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

**2. `index.ts` - Function Implementation**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Embedded CORS headers (avoid import issues)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your function logic here
    const result = { message: 'Function executed successfully' }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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

### Step 4: Deployment Commands

#### Deploy Individual Function
```bash
# Deploy using Management API (recommended)
supabase functions deploy function-name --use-api

# Deploy with debug output
supabase functions deploy function-name --use-api --debug
```

#### Deploy Multiple Functions
```bash
# Deploy each function separately
supabase functions deploy adk-agents --use-api
supabase functions deploy mermaid-cartographer --use-api
supabase functions deploy send-auth-email --use-api
```

### Step 5: Verification

#### Check Deployment Status
```bash
# List all deployed functions
supabase functions list

# Check function details
supabase functions inspect function-name
```

#### Test Function Endpoints
```bash
# Test function via curl
curl -X POST https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 📦 Current Deployed Functions

### 1. **test-deploy**
- **Purpose**: Simple test function for deployment verification
- **URL**: `https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/test-deploy`
- **Status**: ✅ ACTIVE

### 2. **adk-agents**
- **Purpose**: AI agent integration for memory analysis, course intelligence, etc.
- **URL**: `https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/adk-agents`
- **Status**: ✅ ACTIVE
- **Request Format**:
```json
{
  "agent_type": "memory_analysis|course_intel|personalization|career_pathway|study_map|orchestrator",
  "payload": {}
}
```

### 3. **mermaid-cartographer**
- **Purpose**: Generate personalized study maps using Mermaid diagrams
- **URL**: `https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/mermaid-cartographer`
- **Status**: ✅ ACTIVE
- **Request Format**:
```json
{
  "field_of_study": "Computer Science",
  "course_syllabus": ["Topic 1", "Topic 2"],
  "exam_scope": ["Exam Area 1", "Exam Area 2"],
  "user_memory_profile": {
    "memories": [{"category": "learning", "text": "I learn best with visual aids"}]
  }
}
```

### 4. **send-auth-email**
- **Purpose**: Handle authentication email workflows
- **URL**: `https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/send-auth-email`
- **Status**: ✅ ACTIVE

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. **Deployment Hanging/Stuck**
```bash
# Kill stuck processes
taskkill /F /IM supabase.exe

# Use Management API instead of Docker
supabase functions deploy function-name --use-api
```

#### 2. **Import/Module Errors**
- ✅ Embed CORS headers directly in functions
- ✅ Use proper `deno.json` configuration
- ❌ Avoid relative imports to `_shared` folder

#### 3. **CLI Version Issues**
```bash
# Update to latest version
scoop update supabase
supabase --version  # Should be 2.26.9+
```

#### 4. **Secret Configuration Errors**
```bash
# Remove incorrect secrets
supabase secrets unset NEXT_PUBLIC_SUPABASE_URL

# Set correct secrets
supabase secrets set DATABASE_URL=https://your-project.supabase.co
```

## 🔄 Deployment Workflow

### For New Functions:
1. Create function directory: `supabase/functions/new-function/`
2. Add `deno.json` with dependencies
3. Implement `index.ts` with proper error handling
4. Set required secrets
5. Deploy: `supabase functions deploy new-function --use-api`
6. Test endpoint
7. Update frontend integration

### For Function Updates:
1. Modify function code
2. Deploy: `supabase functions deploy function-name --use-api`
3. Verify deployment: `supabase functions list`
4. Test updated functionality

## 📊 Integration with Frontend

### React/TypeScript Integration
```typescript
// src/services/edgeFunctions.ts
const SUPABASE_URL = 'https://okvdirskoukqnjzqsowb.supabase.co'
const SUPABASE_ANON_KEY = 'your_anon_key'

export const callEdgeFunction = async (functionName: string, payload: any) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  
  return response.json()
}

// Usage
const result = await callEdgeFunction('mermaid-cartographer', {
  field_of_study: 'Computer Science',
  course_syllabus: ['Algorithms', 'Data Structures'],
  exam_scope: ['Coding Problems', 'System Design'],
  user_memory_profile: { memories: [] }
})
```

## 🎯 Best Practices

1. **Always use `--use-api` flag** for deployment
2. **Set secrets before deployment**
3. **Embed CORS headers** in function code
4. **Use proper error handling** with try-catch blocks
5. **Test functions individually** before integration
6. **Keep `deno.json` dependencies updated**
7. **Use descriptive function names**
8. **Document API contracts** for each function

## 📈 Monitoring & Maintenance

### Check Function Health
```bash
# List all functions with status
supabase functions list

# View function logs
supabase functions logs function-name
```

### Update Process
1. Test changes locally if possible
2. Deploy to staging/test function first
3. Deploy to production function
4. Monitor logs for errors
5. Rollback if necessary

---

**Last Updated**: June 22, 2025  
**CLI Version**: 2.26.9  
**Project**: Sensa AI (okvdirskoukqnjzqsowb) 