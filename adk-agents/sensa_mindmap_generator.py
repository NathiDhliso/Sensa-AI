import json
import os
import requests
from typing import Dict, Any, List
from datetime import datetime

# AWS and third-party imports
import boto3
from supabase import create_client, Client
import networkx as nx
import pygraphviz as pgv
import google.generativeai as genai
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.idempotency import (
    IdempotencyConfig, 
    idempotent,
    DynamoDBPersistenceLayer
)
from aws_lambda_powertools.utilities.idempotency.exceptions import IdempotencyAlreadyInProgressError

# Exception imports for specific error handling
from botocore.exceptions import ClientError
from google.api_core.exceptions import GoogleAPICallError
try:
    from supabase.client import APIError as SupabaseAPIError
except ImportError:
    # Fallback for different supabase versions
    SupabaseAPIError = Exception

# Initialize logger
logger = Logger()

# Initialize idempotency configuration
persistence_layer = DynamoDBPersistenceLayer(
    table_name=os.environ.get('IDEMPOTENCY_TABLE_NAME', 'mindmap-idempotency'),
    key_attr='id',
    expiry_attr='expiration',
    status_attr='status',
    data_attr='data',
    validation_key_attr='validation'
)

idempotency_config = IdempotencyConfig(
    event_key_jmespath='Records[0].body',
    payload_validation_jmespath='jobId',
    raise_on_no_idempotency_key=False,
    expires_after_seconds=3600,  # 1 hour TTL
    use_local_cache=True,
    local_cache_max_items=1000,
    hash_function='md5'
)

# Global clients (initialized outside handler for reuse)
supabase_client: Client = None
genai_client = None

def get_supabase_credentials() -> Dict[str, str]:
    """
    Retrieve Supabase credentials from AWS Secrets Manager via Lambda Extension.
    
    Returns:
        Dict containing supabase_url and supabase_key
    """
    try:
        # AWS Parameters and Secrets Lambda Extension endpoint
        secrets_extension_endpoint = 'http://localhost:2773/secretsmanager/get'
        secret_name = os.environ.get('SUPABASE_SECRET_NAME', 'sensa-ai/supabase')
        
        # Add AWS session token header for authentication
        headers = {
            'X-Aws-Parameters-Secrets-Token': os.environ.get('AWS_SESSION_TOKEN', '')
        }
        
        response = requests.get(
            f"{secrets_extension_endpoint}?secretId={secret_name}",
            headers=headers,
            timeout=5
        )
        response.raise_for_status()
        
        secret_data = response.json()
        secret_string = json.loads(secret_data['SecretString'])
        
        logger.info("Successfully retrieved Supabase credentials from Secrets Manager")
        return {
            'supabase_url': secret_string['supabase_url'],
            'supabase_key': secret_string['supabase_key']
        }
        
    except Exception as e:
        logger.exception("Failed to retrieve Supabase credentials from Secrets Manager")
        # Fallback to environment variables for development
        logger.warning("Falling back to environment variables for Supabase credentials")
        return {
            'supabase_url': os.environ.get('SUPABASE_URL'),
            'supabase_key': os.environ.get('SUPABASE_ANON_KEY')
        }

def initialize_clients():
    """
    Initialize global clients for Supabase and Google AI.
    """
    global supabase_client, genai_client
    
    if supabase_client is None:
        credentials = get_supabase_credentials()
        supabase_client = create_client(
            credentials['supabase_url'],
            credentials['supabase_key']
        )
        logger.info("Supabase client initialized")
    
    if genai_client is None:
        google_api_key = os.environ.get('GOOGLE_AI_API_KEY')
        if google_api_key:
            genai.configure(api_key=google_api_key)
            genai_client = genai.GenerativeModel('gemini-pro')
            logger.info("Google AI client initialized")
        else:
            logger.error("GOOGLE_AI_API_KEY environment variable not set")

def generate_mindmap_prompt(subject: str) -> str:
    """
    Generate a structured prompt for the AI to create mindmap data.
    
    Args:
        subject: The topic for the mindmap
        
    Returns:
        Formatted prompt string
    """
    return f"""
Create a comprehensive mindmap for the subject: "{subject}"

Please return the response as a valid JSON object with the following exact structure:

{{
  "nodes": [
    {{
      "id": "unique_node_id",
      "label": "Node Label",
      "level": 0,
      "parent_id": null,
      "description": "Brief description of the concept"
    }}
  ],
  "edges": [
    {{
      "source": "parent_node_id",
      "target": "child_node_id",
      "relationship": "describes the relationship type"
    }}
  ]
}}

Guidelines:
- Create a hierarchical structure with the main subject as the root node (level 0)
- Include 15-25 nodes total
- Use levels 0-4 to represent hierarchy depth
- Each node should have a unique ID and meaningful label
- Root node should have parent_id as null
- Include relevant subtopics, concepts, and details
- Ensure all edges connect existing nodes
- Make the mindmap comprehensive but focused

Return only the JSON object, no additional text or formatting.
"""

def update_job_status(job_id: str, status: str, result_data: Dict = None, error_message: str = None):
    """
    Update job status in Supabase mindmap_results table.
    
    Args:
        job_id: Unique job identifier
        status: Job status ('processing', 'completed', 'failed')
        result_data: Generated mindmap data (for completed jobs)
        error_message: Error details (for failed jobs)
    """
    try:
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if result_data:
            update_data['result_data'] = result_data
            
        if error_message:
            update_data['error_message'] = error_message
            
        response = supabase_client.table('mindmap_results').update(update_data).eq('job_id', job_id).execute()
        
        logger.info(f"Updated job {job_id} status to {status}", extra={
            'job_id': job_id,
            'status': status,
            'has_result_data': bool(result_data),
            'has_error': bool(error_message)
        })
        
    except Exception as e:
        logger.exception(f"Failed to update job status for {job_id}", extra={
            'job_id': job_id,
            'intended_status': status,
            'error': str(e)
        })

def process_mindmap_generation(job_id: str, subject: str) -> Dict[str, Any]:
    """
    Core logic for generating mindmap data.
    
    Args:
        job_id: Unique job identifier
        subject: Topic for mindmap generation
        
    Returns:
        Generated mindmap data with node positions
    """
    logger.info(f"Starting mindmap generation for job {job_id}", extra={
        'job_id': job_id,
        'subject': subject
    })
    
    # Generate mindmap structure using AI
    prompt = generate_mindmap_prompt(subject)
    response = genai_client.generate_content(prompt)
    
    # Parse AI response
    try:
        mindmap_data = json.loads(response.text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON for job {job_id}", extra={
            'job_id': job_id,
            'ai_response': response.text[:500],  # Log first 500 chars
            'parse_error': str(e)
        })
        raise ValueError(f"Invalid JSON response from AI: {str(e)}")
    
    # Validate required structure
    if 'nodes' not in mindmap_data or 'edges' not in mindmap_data:
        raise ValueError("AI response missing required 'nodes' or 'edges' fields")
    
    # Create NetworkX graph
    G = nx.DiGraph()
    
    # Add nodes
    for node in mindmap_data['nodes']:
        G.add_node(node['id'], **node)
    
    # Add edges
    for edge in mindmap_data['edges']:
        G.add_edge(edge['source'], edge['target'], **edge)
    
    logger.info(f"Created graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges", extra={
        'job_id': job_id,
        'node_count': G.number_of_nodes(),
        'edge_count': G.number_of_edges()
    })
    
    # Calculate layout using pygraphviz dot layout engine
    try:
        # Convert NetworkX graph to pygraphviz for layout calculation
        A = nx.nx_agraph.to_agraph(G)
        A.layout(prog='dot')
        
        # Extract positions from pygraphviz layout
        positioned_nodes = []
        for node in mindmap_data['nodes']:
            node_id = node['id']
            try:
                # Get node position from pygraphviz
                agraph_node = A.get_node(node_id)
                pos_str = agraph_node.attr['pos']
                x, y = map(float, pos_str.split(','))
                
                # Scale positions for better visualization
                node['x'] = float(x)
                node['y'] = float(y)
            except (KeyError, ValueError, AttributeError):
                # Fallback position if node not found or position parsing fails
                logger.warning(f"Could not get position for node {node_id}, using fallback", extra={
                    'job_id': job_id,
                    'node_id': node_id
                })
                node['x'] = 0.0
                node['y'] = 0.0
            positioned_nodes.append(node)
        
        # Return final mindmap data with positions
        final_data = {
            'nodes': positioned_nodes,
            'edges': mindmap_data['edges'],
            'metadata': {
                'subject': subject,
                'generated_at': datetime.utcnow().isoformat(),
                'node_count': len(positioned_nodes),
                'edge_count': len(mindmap_data['edges']),
                'layout_engine': 'dot'
            }
        }
        
        logger.info(f"Successfully generated mindmap with dot layout for job {job_id}", extra={
            'job_id': job_id,
            'final_node_count': len(positioned_nodes)
        })
        
        return final_data
        
    except Exception as e:
        logger.exception(f"Failed to calculate dot layout for job {job_id}", extra={
            'job_id': job_id,
            'layout_error': str(e)
        })
        raise

@logger.inject_lambda_context(log_event=True)
@idempotent(config=idempotency_config, persistence_store=persistence_layer)
def handler(event, context):
    """
    AWS Lambda handler for processing mindmap generation jobs from SQS.
    
    Args:
        event: Lambda event containing SQS records
        context: Lambda context object
        
    Returns:
        Processing results
    """
    # Initialize clients if not already done
    initialize_clients()
    
    results = []
    
    # Process each SQS record
    for record in event.get('Records', []):
        try:
            # Parse message body
            message_body = json.loads(record['body'])
            job_id = message_body.get('jobId')
            subject = message_body.get('subject')
            
            if not job_id or not subject:
                logger.error("Missing required fields in message", extra={
                    'message_body': message_body,
                    'missing_job_id': not job_id,
                    'missing_subject': not subject
                })
                continue
            
            logger.info(f"Processing mindmap generation job", extra={
                'job_id': job_id,
                'subject': subject,
                'record_id': record.get('messageId')
            })
            
            # Update status to processing
            update_job_status(job_id, 'processing')
            
            # Generate mindmap
            mindmap_data = process_mindmap_generation(job_id, subject)
            
            # Save results and update status to completed
            update_job_status(job_id, 'completed', result_data=mindmap_data)
            
            results.append({
                'job_id': job_id,
                'status': 'completed',
                'node_count': len(mindmap_data['nodes'])
            })
            
        except ClientError as e:
            error_msg = f"AWS service error: {str(e)}"
            logger.exception(f"AWS ClientError for job {job_id}", extra={
                'job_id': job_id,
                'error_code': e.response.get('Error', {}).get('Code'),
                'error_message': str(e)
            })
            update_job_status(job_id, 'failed', error_message=error_msg)
            results.append({'job_id': job_id, 'status': 'failed', 'error': error_msg})
            
        except SupabaseAPIError as e:
            error_msg = f"Supabase API error: {str(e)}"
            logger.exception(f"Supabase API error for job {job_id}", extra={
                'job_id': job_id,
                'error_message': str(e)
            })
            update_job_status(job_id, 'failed', error_message=error_msg)
            results.append({'job_id': job_id, 'status': 'failed', 'error': error_msg})
            
        except GoogleAPICallError as e:
            error_msg = f"Google AI API error: {str(e)}"
            logger.exception(f"Google AI API error for job {job_id}", extra={
                'job_id': job_id,
                'error_code': getattr(e, 'code', 'unknown'),
                'error_message': str(e)
            })
            update_job_status(job_id, 'failed', error_message=error_msg)
            results.append({'job_id': job_id, 'status': 'failed', 'error': error_msg})
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.exception(f"Unexpected error for job {job_id}", extra={
                'job_id': job_id,
                'error_type': type(e).__name__,
                'error_message': str(e)
            })
            update_job_status(job_id, 'failed', error_message=error_msg)
            results.append({'job_id': job_id, 'status': 'failed', 'error': error_msg})
    
    logger.info(f"Completed processing {len(results)} jobs", extra={
        'total_jobs': len(results),
        'completed_jobs': len([r for r in results if r['status'] == 'completed']),
        'failed_jobs': len([r for r in results if r['status'] == 'failed'])
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed_jobs': len(results),
            'results': results
        })
    }