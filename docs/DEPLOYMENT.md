# Deployment Guide

This guide covers the deployment setup for the Sensa AI application.

## 🚀 Current Deployment: AWS Amplify

The Sensa AI application is currently deployed using **AWS Amplify** with the following setup:

### **Live Application**
- **URL**: https://sensalearn.co.za
- **Hosting**: AWS Amplify
- **Domain**: Custom domain with nameservers configured
- **Auto-deployment**: Connected to GitHub repository

### **Deployment Process**
1. **Code Push**: Push to `main` branch
2. **GitHub Actions**: Runs tests and builds application
3. **AWS Amplify**: Automatically detects changes and deploys
4. **Live Update**: Changes appear on sensalearn.co.za

## 🔧 AWS Amplify Configuration

### **Environment Variables**
Set in AWS Amplify Console → App Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### **Build Settings**
AWS Amplify uses the following build configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## 🔄 Alternative Deployment Options

### **Manual Deployment**

If you need to deploy to other services:

#### **Static Hosting Services**
```bash
# Build the application
npm run build

# Deploy the dist/ folder to:
# - Any static hosting service
# - CDN provider
# - Web server
```

#### **Other Cloud Providers**
The application is a standard React SPA and can be deployed to:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting
- Any static hosting service

## 🔧 AWS Amplify Setup (Reference)

### **Initial Setup Steps**
1. **Connect Repository**: Link GitHub repository to AWS Amplify
2. **Configure Build**: Set build commands and output directory
3. **Environment Variables**: Add required environment variables
4. **Custom Domain**: Configure custom domain and nameservers
5. **Auto-Deploy**: Enable automatic deployment on push

### **Domain Configuration**
- **Domain**: sensalearn.co.za
- **Nameservers**: Configured to point to AWS Amplify
- **SSL**: Automatically managed by AWS
- **CDN**: Global distribution via CloudFront

## 📋 Environment Variables

### Required Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables

```env
GEMINI_API_KEY=your_gemini_api_key
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails
- **Cause**: Missing environment variables
- **Solution**: Check AWS Amplify environment variables

#### 2. Deployment Fails
- **Cause**: Build configuration issues
- **Solution**: Check AWS Amplify build logs

#### 3. Domain Issues
- **Cause**: DNS configuration problems
- **Solution**: Verify nameserver configuration

### Debugging Steps

1. **Check AWS Amplify Console**: View build logs and deployment status
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test Local Build**: Run `npm run build` locally to verify
4. **Check Domain DNS**: Verify nameservers point to AWS Amplify

## 🎯 Manual Build and Deploy

If you need to build and deploy manually:

```bash
# Build the application locally
npm run build

# The dist/ folder contains the production build
# Upload to any static hosting service
```

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Amplify Console Guide](https://docs.amplify.aws/console/)
- [Custom Domain Setup](https://docs.amplify.aws/console/custom-domains/)
- [Environment Variables](https://docs.amplify.aws/console/environment-variables/)

## 🆘 Getting Help

If you're having deployment issues:

1. Check the [AWS Amplify Console](https://console.aws.amazon.com/amplify/) for build logs
2. Verify environment variables are set correctly
3. Check the [GitHub Actions logs](https://github.com/YOUR_USERNAME/Sensa-AI/actions) for build status
4. Ensure your domain nameservers are configured correctly

The application is currently live at https://sensalearn.co.za with automatic deployment from GitHub!
