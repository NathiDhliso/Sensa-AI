#!/usr/bin/env pwsh
# Simplified Sensa AI Backend Deployment Script using AWS SAM (without Docker)
# This script builds and deploys without Docker containers for faster deployment

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$Guided
)

# Color functions for better output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Error "AWS CLI is not installed or not in PATH"
        exit 1
    }
    
    # Check SAM CLI
    if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
        Write-Error "AWS SAM CLI is not installed or not in PATH"
        exit 1
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
        Write-Success "AWS credentials are configured"
    } catch {
        Write-Error "AWS credentials are not configured"
        exit 1
    }
    
    Write-Success "All prerequisites met!"
}

# Load environment variables
function Set-EnvironmentVariables {
    Write-Info "Loading environment variables..."
    
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        Write-Success "Environment variables loaded from .env file"
    } else {
        Write-Warning ".env file not found. Using system environment variables."
    }
}

# Validate required environment variables
function Test-EnvironmentVariables {
    Write-Info "Validating required environment variables..."
    
    $requiredVars = @(
        "SUPABASE_SERVICE_ROLE_KEY",
        "GOOGLE_AI_API_KEY"
    )
    
    $missing = @()
    foreach ($var in $requiredVars) {
        if (-not [Environment]::GetEnvironmentVariable($var)) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        $missing | ForEach-Object { Write-Error "  - $_" }
        exit 1
    }
    
    Write-Success "All required environment variables are set"
}

# Build the SAM application (without Docker)
function Invoke-SamBuild {
    Write-Info "Building SAM application (native build)..."
    
    try {
        sam build --parallel
        if ($LASTEXITCODE -ne 0) {
            throw "SAM build failed with exit code $LASTEXITCODE"
        }
        Write-Success "SAM build completed successfully"
    } catch {
        Write-Error "SAM build failed: $_"
        exit 1
    }
}

# Deploy the SAM application
function Invoke-SamDeploy {
    Write-Info "Deploying SAM application to $Environment environment..."
    
    $deployArgs = @(
        "deploy",
        "--config-env", $Environment,
        "--parameter-overrides",
        "SupabaseServiceRoleKey=$([Environment]::GetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY'))",
        "GoogleAIApiKey=$([Environment]::GetEnvironmentVariable('GOOGLE_AI_API_KEY'))"
    )
    
    if ($Guided) {
        $deployArgs += "--guided"
    }
    
    Write-Info "Running: sam $($deployArgs -join ' ')"
    
    try {
        & sam @deployArgs
        if ($LASTEXITCODE -ne 0) {
            throw "SAM deploy failed with exit code $LASTEXITCODE"
        }
        Write-Success "SAM deployment completed successfully"
    } catch {
        Write-Error "SAM deployment failed: $_"
        exit 1
    }
}

# Get stack outputs
function Get-StackOutputs {
    Write-Info "Retrieving stack outputs..."
    
    $stackName = "sensa-mindmap-backend-$Environment"
    
    try {
        $outputs = aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
        
        Write-Success "Deployment completed! Here are your endpoints:"
        Write-Host ""
        
        foreach ($output in $outputs) {
            Write-Host "$($output.OutputKey): " -NoNewline -ForegroundColor Yellow
            Write-Host $output.OutputValue -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Info "Save these endpoints for your frontend configuration!"
        
        # Save outputs to a file for easy reference
        $outputFile = "sam-outputs-$Environment.json"
        $outputs | ConvertTo-Json -Depth 3 | Out-File $outputFile
        Write-Info "Outputs saved to: $outputFile"
        
    } catch {
        Write-Warning "Could not retrieve stack outputs: $_"
    }
}

# Main execution
function Main {
    Write-Info "=== Sensa AI Backend Deployment using AWS SAM (Fast Mode) ==="
    Write-Info "Environment: $Environment"
    Write-Info "Region: $Region"
    Write-Host ""
    
    Test-Prerequisites
    Set-EnvironmentVariables
    Test-EnvironmentVariables
    Invoke-SamBuild
    Invoke-SamDeploy
    Get-StackOutputs
    
    Write-Success "Deployment completed successfully!"
    Write-Info "Your Sensa AI backend is now running on AWS!"
}

# Handle Ctrl+C gracefully
trap {
    Write-Warning "Deployment interrupted by user"
    exit 1
}

# Run main function
Main