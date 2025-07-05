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

## Overview
This document provides comprehensive deployment instructions for Sensa AI, an adaptive learning platform with AI-powered personalization.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI Engine**: Google Gemini API
- **Deployment**: Google Cloud Platform

## Core Features

### Enhanced Know Me Feature (Problem-Based Learning)
The Know Me feature has been enhanced to implement problem-based learning through personal experience connections:

#### Methodology
1. **Problem-Solution Analysis**: AI analyzes exam papers to identify technical solutions and extract underlying problems
2. **Experience-Based Questions**: Creates personalized questions that connect academic problems to life experiences
3. **Scenario-Based Assessment**: Tests understanding through real-world scenarios rather than solution memorization
4. **Personalized Reporting**: Provides insights on problem-solving patterns and exam readiness

#### Example Workflow
- **Technical Solution**: "Configure VNet peering between VNet-Sales and VNet-Marketing"
- **Underlying Problem**: "Enable secure communication between isolated environments"
- **Life Question**: "Tell me about a time you helped two different groups collaborate while respecting their boundaries"

#### API Endpoints
- `know_me_start`: Analyzes PDF content and extracts problem-solution patterns
- `know_me_questionnaire`: Generates scenarios based on user responses
- `know_me_score`: Scores answers with real-time hints
- `know_me_report`: Creates comprehensive performance reports

### Mind Map Generation
- AI-powered mind map creation from study materials
- Mermaid.js integration for interactive visualizations
- Personalized content based on user learning style

### Memory Bank
- Personal memory storage and analysis
- AI-driven insights connecting memories to learning
- Contextual learning recommendations

### Study Material Upload
- PDF processing and content extraction
- Intelligent subject identification
- Automated learning objective generation

## Prerequisites

### Required Accounts
1. **Supabase Account** - Database and backend services
2. **Google Cloud Account** - AI services and deployment
3. **GitHub Account** - Source code management

### Required API Keys
1. **Google AI API Key** (Gemini)
   ```bash
   export GOOGLE_AI_API_KEY="your_api_key_here"
   ```

2. **Supabase Keys**
   ```bash
   export VITE_SUPABASE_URL="your_supabase_url"
   export VITE_SUPABASE_ANON_KEY="your_anon_key"
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

## Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd sensa-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local`:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### 4. Supabase Setup
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Deploy edge functions
supabase functions deploy adk-agents --use-api
supabase functions deploy mermaid-cartographer --use-api
```

### 5. Start Development Server
```bash
npm run dev
```

## Production Deployment

### Google Cloud Platform Setup

#### 1. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

#### 2. Build and Deploy
```bash
# Build the application
npm run build

# Deploy to Cloud Run
gcloud run deploy sensa-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_SUPABASE_URL=$VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY"
```

#### 3. Configure Environment Variables
```bash
gcloud run services update sensa-ai \
  --set-env-vars="GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY" \
  --region us-central1
```

### Alternative Deployment Options

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build
npm run build

# Deploy dist folder to Netlify
```

## Database Schema

### Core Tables
- `users` - User authentication and profiles
- `memories` - Personal memory storage
- `courses` - Course information and progress
- `study_sessions` - Learning session tracking
- `know_me_sessions` - Know Me feature data

### Key Functions
- `analyze_memory` - Memory analysis and insights
- `generate_mindmap` - AI-powered mind map creation
- `process_know_me` - Problem-based learning analysis

## Security Configuration

### Row Level Security (RLS)
All tables implement RLS policies to ensure data isolation:
```sql
-- Example policy for memories table
CREATE POLICY "Users can only access their own memories"
ON memories FOR ALL
USING (auth.uid() = user_id);
```

### API Security
- All edge functions require authentication
- Rate limiting implemented
- Input validation and sanitization
- CORS properly configured

## Monitoring and Maintenance

### Health Checks
- `/api/health` - Application health status
- Edge function monitoring via Supabase dashboard
- Google Cloud monitoring for AI services

### Performance Optimization
- Image optimization and lazy loading
- Code splitting and tree shaking
- CDN configuration for static assets
- Database query optimization

### Backup Strategy
- Automated daily Supabase backups
- Git-based configuration backup
- Environment variable documentation

## Troubleshooting

### Common Issues

#### 1. AI API Failures
- Check Google AI API key validity
- Verify API quotas and limits
- Review error logs in Supabase

#### 2. Authentication Issues
- Confirm Supabase configuration
- Check RLS policies
- Verify JWT token handling

#### 3. Performance Issues
- Monitor database query performance
- Check edge function execution times
- Analyze bundle size and loading times

### Debug Commands
```bash
# Check Supabase connection
supabase status

# View edge function logs
supabase functions logs adk-agents

# Test API endpoints
curl -X POST "your-supabase-url/functions/v1/adk-agents" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"action": "health_check"}}'
```

## Support and Documentation

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Google AI Documentation](https://ai.google.dev/docs)
- [React Documentation](https://react.dev)

### Contact
For deployment support and technical issues, please refer to the project repository or contact the development team.

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Enhanced Know Me Feature) 