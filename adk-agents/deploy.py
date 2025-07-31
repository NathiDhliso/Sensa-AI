#!/usr/bin/env python3
"""
Deployment script for Sensa ADK Agents to Google Cloud Functions
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description=""):
    """Run a shell command and handle errors"""
    print(f"Running: {description or command}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False

def check_requirements():
    """Check if required tools are installed"""
    print("Checking requirements...")
    
    # Check if gcloud is installed
    if not run_command("gcloud --version", "Checking Google Cloud CLI"):
        print("Error: Google Cloud CLI is not installed or not in PATH")
        print("Install it from: https://cloud.google.com/sdk/docs/install")
        return False
    
    # Check if authenticated
    if not run_command("gcloud auth list", "Checking authentication"):
        print("Error: Not authenticated with Google Cloud")
        print("Run: gcloud auth login")
        return False
    
    return True

def deploy_to_cloud_functions():
    """Deploy the agents to Google Cloud Functions"""
    
    # Check if we're in the right directory
    if not os.path.exists("src"):
        print("Error: Please run this script from the adk-agents directory")
        return False
    
    # Set default project if not set
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
    if not project_id:
        print("Warning: GOOGLE_CLOUD_PROJECT environment variable not set")
        print("Using default project from gcloud config")
    
    print("Deploying Sensa Agents to Google Cloud Functions...")
    
    # Deploy main agent handler
    deploy_cmd = """
    gcloud functions deploy sensa-agents \
        --runtime python312 \
        --trigger-http \
        --allow-unauthenticated \
        --source . \
        --entry-point sensa_agents_handler \
        --memory 512MB \
        --timeout 540s \
        --set-env-vars FUNCTION_TARGET=sensa_agents_handler
    """
    
    if not run_command(deploy_cmd, "Deploying main agent function"):
        return False
    
    # Deploy health check function
    health_deploy_cmd = """
    gcloud functions deploy sensa-agents-health \
        --runtime python312 \
        --trigger-http \
        --allow-unauthenticated \
        --source . \
        --entry-point health_check \
        --memory 256MB \
        --timeout 60s \
        --set-env-vars FUNCTION_TARGET=health_check
    """
    
    if not run_command(health_deploy_cmd, "Deploying health check function"):
        return False
    
    print("\n✅ Deployment successful!")
    print("\nNext steps:")
    print("1. Set your environment variables in Cloud Functions:")
    print("   - GOOGLE_AI_API_KEY")
    print("   - SUPABASE_URL") 
    print("   - SUPABASE_ANON_KEY")
    print("\n2. Update your frontend to use the new Cloud Function URLs")
    print("\n3. Test the deployment with the health check endpoint")
    
    return True

def create_main_py():
    """Create main.py for Cloud Functions deployment"""
    main_py_content = """
# Cloud Functions entry point
from src.main import sensa_agents_handler, health_check

# Export the handlers for Cloud Functions
__all__ = ['sensa_agents_handler', 'health_check']
"""
    
    with open("main.py", "w") as f:
        f.write(main_py_content.strip())
    
    print("Created main.py for Cloud Functions deployment")

def main():
    """Main deployment function"""
    print("🚀 Sensa ADK Agents Deployment Script")
    print("=" * 50)
    
    if not check_requirements():
        sys.exit(1)
    
    # Create the main.py file for Cloud Functions
    create_main_py()
    
    if not deploy_to_cloud_functions():
        print("❌ Deployment failed")
        sys.exit(1)
    
    print("🎉 Deployment completed successfully!")

if __name__ == "__main__":
    main()