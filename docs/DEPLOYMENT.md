# Deployment Guide

This guide covers different deployment options for the Sensa AI application.

## 🚀 Quick Deployment Options

### Option 1: Static Hosting (Recommended for beginners)

The easiest way to deploy is using static hosting services:

#### **Vercel** (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Build the app: `npm run build`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard

#### **Netlify**
1. Build the app: `npm run build`
2. Drag the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)
3. Set environment variables in Netlify dashboard

#### **GitHub Pages**
1. Build the app: `npm run build`
2. Push `dist/` contents to `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Option 2: Google Cloud Run (Advanced)

For automatic deployment via GitHub Actions, follow this setup:

## 🔧 Google Cloud Setup

### Prerequisites
- Google Cloud Project with billing enabled
- Cloud Run API enabled
- Cloud Build API enabled

### Step 1: Create Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export SERVICE_ACCOUNT_NAME="sensa-ai-deploy"

# Create service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --description="Service account for Sensa AI deployment" \
    --display-name="Sensa AI Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### Step 2: Create Workload Identity Federation

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" \
    --description="Pool for GitHub Actions"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
    --attribute-condition="assertion.repository=='YOUR_GITHUB_USERNAME/Sensa-AI'"

# Get the provider name (you'll need this for GitHub secrets)
gcloud iam workload-identity-pools providers describe "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --format="value(name)"
```

### Step 3: Bind Service Account

```bash
# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
    "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/Sensa-AI"
```

### Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value | Example |
|-------------|-------|---------|
| `WIF_PROVIDER` | Full provider name from step 2 | `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | Service account email | `sensa-ai-deploy@your-project.iam.gserviceaccount.com` |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## 📋 Environment Variables

### Required for All Deployments

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional (for Edge Functions)

```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "invalid_target" Error
- **Cause**: WIF provider doesn't exist or is misconfigured
- **Solution**: Verify provider name format and ensure it exists

#### 2. Authentication Failed
- **Cause**: Service account permissions or WIF binding issues
- **Solution**: Check IAM bindings and service account roles

#### 3. Build Fails
- **Cause**: Missing environment variables
- **Solution**: Verify all required secrets are set in GitHub

### Debugging Commands

```bash
# Check if WIF pool exists
gcloud iam workload-identity-pools list --location=global

# Check if provider exists
gcloud iam workload-identity-pools providers list \
    --workload-identity-pool=github-pool --location=global

# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
```

## 🎯 Manual Deployment

If automatic deployment isn't working, you can deploy manually:

### Using Google Cloud CLI

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

### Using Docker

```bash
# Build Docker image
docker build -t sensa-ai .

# Run locally to test
docker run -p 8080:8080 \
    -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    -e VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    sensa-ai

# Deploy to Cloud Run
gcloud run deploy sensa-ai \
    --image sensa-ai \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation Guide](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions with Google Cloud](https://github.com/google-github-actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Netlify Deployment Guide](https://docs.netlify.com/)

## 🆘 Getting Help

If you're still having issues:

1. Check the [GitHub Actions logs](https://github.com/YOUR_USERNAME/Sensa-AI/actions) for detailed error messages
2. Verify your Google Cloud project has the necessary APIs enabled
3. Ensure your service account has the correct permissions
4. Double-check the format of your WIF provider and service account names

For immediate deployment, consider using Vercel or Netlify as they're much simpler to set up!
