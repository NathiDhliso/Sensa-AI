# Sensa AI Backend Deployment with AWS SAM

This guide explains how to deploy the Sensa AI backend infrastructure using AWS SAM (Serverless Application Model).

## Prerequisites

### Required Tools
1. **AWS CLI** - [Installation Guide](https://aws.amazon.com/cli/)
2. **AWS SAM CLI** - [Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
3. **Docker** - [Installation Guide](https://docs.docker.com/get-docker/) (recommended for consistent builds)
4. **PowerShell** (Windows) or **Bash** (Linux/Mac)

### AWS Setup
1. **AWS Account** with appropriate permissions
2. **AWS Credentials** configured:
   ```bash
   aws configure
   ```
3. **Environment Variables** in `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

## Quick Start

### 1. One-Command Deployment (Recommended)

```powershell
# Deploy to development environment
.\deploy-sam.ps1 -Environment dev

# Deploy to production environment
.\deploy-sam.ps1 -Environment prod

# Deploy with guided setup (first time)
.\deploy-sam.ps1 -Environment dev -Guided
```

### 2. Manual Step-by-Step Deployment

```bash
# 1. Validate the template
sam validate

# 2. Build the application
sam build --use-container

# 3. Deploy (first time - guided)
sam deploy --guided --config-env dev

# 4. Deploy (subsequent times)
sam deploy --config-env dev
```

## Deployment Environments

### Development Environment
```powershell
.\deploy-sam.ps1 -Environment dev
```
- Stack Name: `sensa-mindmap-backend-dev`
- Faster deployment with less confirmation
- Suitable for testing and development

### Staging Environment
```powershell
.\deploy-sam.ps1 -Environment staging
```
- Stack Name: `sensa-mindmap-backend-staging`
- Production-like environment for final testing
- Requires changeset confirmation

### Production Environment
```powershell
.\deploy-sam.ps1 -Environment prod
```
- Stack Name: `sensa-mindmap-backend-prod`
- Full production deployment
- Maximum security and confirmation requirements

## Local Development

### Start Local API
```bash
# Start local API Gateway and Lambda
sam local start-api --warm-containers EAGER

# Or use the deployment script
.\deploy-sam.ps1 -WatchMode
```

### Test Local Function
```bash
# Test with sample event
sam local invoke SensaMindmapFunction --event test-payload.json
```

## Architecture Overview

The SAM template deploys:

### Core Services
- **Lambda Function**: `sensa-mindmap-function`
  - Runtime: Python 3.9
  - Memory: 1024 MB
  - Timeout: 5 minutes
  - Handles both API Gateway and SQS events

- **API Gateway**: REST API with CORS enabled
  - Endpoint: `/sensa-mindmap-job`
  - Methods: POST, OPTIONS
  - Automatic CORS headers

- **SQS Queue**: Asynchronous job processing
  - Main queue: `sensa-mindmap-job-queue`
  - Dead letter queue: `sensa-mindmap-job-dlq`
  - Retry policy: 3 attempts

### Security & Storage
- **Secrets Manager**: Secure credential storage
  - Supabase credentials
  - Google AI API key
  - Automatic rotation support

- **DynamoDB**: Idempotency table
  - Prevents duplicate processing
  - TTL enabled (1 hour)
  - Pay-per-request billing

- **CloudWatch**: Logging and monitoring
  - Structured logging with AWS PowerTools
  - 14-day log retention
  - Custom metrics namespace

## Configuration

### Environment Variables
The Lambda function receives these environment variables:
- `ENVIRONMENT`: Deployment environment (dev/staging/prod)
- `SUPABASE_SECRET_NAME`: Name of Supabase secret in Secrets Manager
- `GOOGLE_AI_SECRET_NAME`: Name of Google AI secret in Secrets Manager
- `IDEMPOTENCY_TABLE_NAME`: DynamoDB table for idempotency
- `SQS_QUEUE_URL`: URL of the SQS queue

### SAM Configuration
The `samconfig.toml` file contains environment-specific settings:
- Stack names
- Parameter overrides
- Deployment preferences
- Build configurations

## Monitoring & Troubleshooting

### View Logs
```bash
# View Lambda logs
sam logs --stack-name sensa-mindmap-backend-dev --tail

# View specific function logs
aws logs tail /aws/lambda/dev-sensa-mindmap-function --follow
```

### Check Stack Status
```bash
# View stack resources
aws cloudformation describe-stacks --stack-name sensa-mindmap-backend-dev

# View stack events
aws cloudformation describe-stack-events --stack-name sensa-mindmap-backend-dev
```

### Monitor SQS Queue
```bash
# Check queue attributes
aws sqs get-queue-attributes --queue-url <QUEUE_URL> --attribute-names All

# View messages in DLQ
aws sqs receive-message --queue-url <DLQ_URL>
```

## Cost Optimization

### Pay-Per-Use Resources
- **Lambda**: Only charged for execution time
- **API Gateway**: Per request pricing
- **DynamoDB**: Pay-per-request mode
- **SQS**: Per message pricing

### Estimated Monthly Costs (1000 requests)
- Lambda: ~$0.20
- API Gateway: ~$3.50
- DynamoDB: ~$1.25
- SQS: ~$0.40
- Secrets Manager: ~$0.40
- **Total**: ~$5.75/month

## Cleanup

### Delete Stack
```bash
# Delete development stack
sam delete --stack-name sensa-mindmap-backend-dev

# Delete with confirmation
aws cloudformation delete-stack --stack-name sensa-mindmap-backend-dev
```

### Manual Cleanup
Some resources may need manual deletion:
- S3 buckets (if any)
- CloudWatch log groups
- Secrets Manager secrets

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear build cache
   sam build --use-container --cached --parallel
   ```

2. **Permission Errors**
   - Check AWS credentials: `aws sts get-caller-identity`
   - Verify IAM permissions for CloudFormation, Lambda, API Gateway

3. **Docker Issues**
   - Ensure Docker is running
   - Try without `--use-container` flag

4. **Secret Access Errors**
   - Verify secret names in Secrets Manager
   - Check Lambda execution role permissions

### Support
For additional support:
- Check AWS SAM documentation
- Review CloudFormation events
- Enable debug logging: `export SAM_CLI_DEBUG=1`

## Next Steps

After successful deployment:
1. **Update Frontend**: Configure API endpoint in your frontend application
2. **Test Integration**: Send test requests to verify functionality
3. **Monitor Performance**: Set up CloudWatch alarms
4. **Scale Configuration**: Adjust Lambda memory/timeout as needed

The deployment outputs will provide the API Gateway endpoint URL and other resource identifiers needed for frontend integration.