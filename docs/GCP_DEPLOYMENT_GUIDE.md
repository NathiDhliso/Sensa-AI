# Sensa AI - GCP Deployment Guide

## 🚀 Overview
This guide will help you deploy Sensa AI to Google Cloud Platform using GitHub Actions CI/CD with Cloud Run.

## 📋 Prerequisites

### 1. Google Cloud Platform Setup
- GCP account with billing enabled
- A GCP project created
- Enable required APIs:
  ```bash
  gcloud services enable run.googleapis.com
  gcloud services enable containerregistry.googleapis.com
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable iam.googleapis.com
  ```

### 2. GitHub Repository
- Fork or clone the Sensa AI repository
- Ensure you have admin access to set up secrets

## 🔧 Setup Instructions

### Step 1: Create GCP Service Account

1. **Create Service Account:**
   ```bash
   gcloud iam service-accounts create github-actions \
     --description="Service account for GitHub Actions" \
     --display-name="GitHub Actions"
   ```

2. **Grant Required Permissions:**
   ```bash
   # Cloud Run Admin
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   # Storage Admin (for Container Registry)
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   # Service Account User
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

### Step 2: Set Up Workload Identity Federation (Recommended)

1. **Create Workload Identity Pool:**
   ```bash
   gcloud iam workload-identity-pools create "github-pool" \
     --project="YOUR_PROJECT_ID" \
     --location="global" \
     --display-name="GitHub Actions Pool"
   ```

2. **Create Workload Identity Provider:**
   ```bash
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project="YOUR_PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

3. **Allow GitHub Repository to Impersonate Service Account:**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     --project="YOUR_PROJECT_ID" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/sensa-ai" \
     github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### Step 3: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_PROJECT_ID` | your-project-id | Your GCP Project ID |
| `WIF_PROVIDER` | projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider | Workload Identity Provider |
| `WIF_SERVICE_ACCOUNT` | github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com | Service Account Email |
| `VITE_SUPABASE_URL` | https://your-supabase-url.supabase.co | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | your-supabase-anon-key | Supabase Anonymous Key |

### Step 4: Update Environment Variables

1. **Create production environment file:**
   ```bash
   # .env.production
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   NODE_ENV=production
   ```

2. **Update Supabase configuration** for production domain:
   - Add your Cloud Run URL to Supabase Auth settings
   - Update CORS settings if needed

## 🚀 Deployment Process

### Automatic Deployment
1. **Push to main/master branch:**
   ```bash
   git add .
   git commit -m "Deploy to GCP"
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub Actions tab
   - Watch the deployment progress
   - Check logs for any issues

### Manual Deployment
If you prefer manual deployment:

```bash
# Build locally
npm run build

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/sensa-ai .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/sensa-ai

# Deploy to Cloud Run
gcloud run deploy sensa-ai \
  --image gcr.io/YOUR_PROJECT_ID/sensa-ai \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

## 🔍 Monitoring & Troubleshooting

### Check Deployment Status
```bash
# Get service details
gcloud run services describe sensa-ai --region us-central1

# View logs
gcloud logs read --service sensa-ai
```

### Common Issues

1. **Authentication Errors:**
   - Verify Workload Identity Federation setup
   - Check service account permissions

2. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

3. **Runtime Errors:**
   - Check environment variables
   - Verify Supabase configuration

### Health Checks
- Service health: `https://your-service-url/health`
- Application: `https://your-service-url`

## 🛡️ Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate keys regularly

2. **Service Account:**
   - Use least privilege principle
   - Regularly audit permissions
   - Enable audit logging

3. **Container Security:**
   - Use Alpine-based images
   - Regular security updates
   - Scan images for vulnerabilities

## 💰 Cost Optimization

1. **Cloud Run Settings:**
   - Set appropriate memory/CPU limits
   - Configure max instances
   - Use minimum instances = 0 for cost savings

2. **Container Registry:**
   - Clean up old images regularly
   - Use lifecycle policies

3. **Monitoring:**
   - Set up billing alerts
   - Monitor resource usage

## 🔄 CI/CD Pipeline Features

- ✅ **Automated Testing** - Runs tests before deployment
- ✅ **Multi-stage Builds** - Optimized Docker images
- ✅ **Health Checks** - Verifies deployment success
- ✅ **Rollback Support** - Easy rollback to previous versions
- ✅ **Environment Management** - Separate staging/production
- ✅ **Security Scanning** - Container vulnerability checks

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review Cloud Run logs
3. Verify all secrets are configured
4. Check GCP service quotas

## 🎉 Success!

Once deployed, your Sensa AI application will be available at:
`https://sensa-ai-[hash]-uc.a.run.app`

The deployment includes:
- 🚀 **Automatic scaling** based on traffic
- 🔒 **HTTPS by default** with managed certificates
- 📊 **Built-in monitoring** and logging
- 🔄 **Zero-downtime deployments**
- 💰 **Pay-per-use** pricing model 