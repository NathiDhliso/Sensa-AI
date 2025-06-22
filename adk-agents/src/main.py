import json
import asyncio
from typing import Dict, Any
from functions_framework import http
import flask
from .agents import OrchestratorAgent
from .config import config

# Initialize the orchestrator agent
orchestrator = None

def get_orchestrator():
    """Get or create the orchestrator agent"""
    global orchestrator
    if orchestrator is None:
        orchestrator = OrchestratorAgent()
    return orchestrator

@http
def sensa_agents_handler(request: flask.Request) -> flask.Response:
    """Main HTTP handler for Sensa ADK Agents"""
    
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    # Set CORS headers for actual requests
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Validate configuration
        if not config.validate():
            return json.dumps({
                'success': False,
                'error': 'Server configuration error. Missing required environment variables.'
            }), 500, headers
        
        # Parse request data
        if request.method != 'POST':
            return json.dumps({
                'success': False,
                'error': 'Only POST requests are supported'
            }), 405, headers
        
        try:
            request_data = request.get_json()
            if not request_data:
                raise ValueError("No JSON data provided")
        except Exception as e:
            return json.dumps({
                'success': False,
                'error': f'Invalid JSON data: {str(e)}'
            }), 400, headers
        
        # Get orchestrator and process request
        agent = get_orchestrator()
        
        # Run the async process in the event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(agent.process(request_data))
            return json.dumps(result), 200, headers
        finally:
            loop.close()
    
    except Exception as e:
        print(f"Sensa Agents Error: {str(e)}")
        return json.dumps({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500, headers

# Health check endpoint
@http
def health_check(request: flask.Request) -> flask.Response:
    """Health check endpoint"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        agent = get_orchestrator()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            health_status = loop.run_until_complete(agent.health_check())
            return json.dumps(health_status), 200, headers
        finally:
            loop.close()
    
    except Exception as e:
        return json.dumps({
            'status': 'unhealthy',
            'error': str(e)
        }), 500, headers

# For local testing
if __name__ == '__main__':
    import sys
    
    # Simple test
    test_data = {
        'action': 'analyze_memory',
        'memory_content': 'I remember building a treehouse with my dad when I was 8.',
        'category': 'childhood'
    }
    
    print("Testing Sensa Agents locally...")
    
    try:
        agent = get_orchestrator()
        
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(agent.process(test_data))
        
        print("Test successful!")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Test failed: {str(e)}")
        sys.exit(1) 