import json
import os
import requests
from typing import Dict, Any, List
from datetime import datetime

# AWS and third-party imports
import boto3
from supabase import create_client, Client
import networkx as nx
# import pygraphviz as pgv  # Optional dependency for advanced layouts
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

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
sqs_client = boto3.client('sqs')

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

# Cache for secrets to avoid repeated API calls
_secrets_cache = {}

def get_secret(secret_name: str) -> Dict[str, Any]:
    """Retrieve secret from AWS Secrets Manager with caching."""
    if secret_name in _secrets_cache:
        return _secrets_cache[secret_name]
    
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(response['SecretString'])
        _secrets_cache[secret_name] = secret_value
        return secret_value
    except ClientError as e:
        logger.error(f"Failed to retrieve secret {secret_name}: {e}")
        raise

def get_supabase_client() -> Client:
    """Initialize Supabase client with credentials from Secrets Manager."""
    secret_name = os.environ.get('SUPABASE_SECRET_NAME')
    if not secret_name:
        raise ValueError("SUPABASE_SECRET_NAME environment variable not set")
    
    credentials = get_secret(secret_name)
    return create_client(
        credentials['url'],
        credentials['service_role_key']
    )

def get_google_ai_client():
    """Initialize Google AI client with credentials from Secrets Manager."""
    secret_name = os.environ.get('GOOGLE_AI_SECRET_NAME')
    if not secret_name:
        raise ValueError("GOOGLE_AI_SECRET_NAME environment variable not set")
    
    credentials = get_secret(secret_name)
    genai.configure(api_key=credentials['api_key'])
    return genai.GenerativeModel('gemini-1.5-flash')

# Global clients (initialized outside handler for reuse)
supabase_client: Client = None
genai_client = None

# Removed old get_supabase_credentials function - now using get_supabase_client() with direct Secrets Manager access

def initialize_clients():
    """
    Initialize global clients for Supabase and Google AI using AWS Secrets Manager.
    """
    global supabase_client, genai_client
    
    if supabase_client is None:
        try:
            supabase_client = get_supabase_client()
            logger.info("Supabase client initialized from Secrets Manager")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    if genai_client is None:
        try:
            genai_client = get_google_ai_client()
            logger.info("Google AI client initialized from Secrets Manager")
        except Exception as e:
            logger.error(f"Failed to initialize Google AI client: {e}")
            raise

def generate_mindmap_prompt(subject: str) -> str:
    """
    Generate a structured prompt for the AI to create mindmap data.
    Uses advanced prompt engineering with strict JSON schema enforcement.
    
    Args:
        subject: The topic for the mindmap
        
    Returns:
        Formatted prompt string optimized for schema-constrained generation
    """
    return f"""You are a helpful assistant that specializes in knowledge structuring and graph theory. Your task is to analyze the provided subject and generate a hierarchical mind map structure.

The output must be a single, valid JSON object that strictly conforms to the following Pydantic schema definition. Do not include any explanatory text, markdown formatting, or any content outside of the JSON object itself.

JSON Schema:

{{
  "type": "object",
  "properties": {{
    "nodes": {{
      "type": "array",
      "items": {{
        "type": "object",
        "properties": {{
          "id": {{
            "type": "string",
            "description": "A unique identifier for the node, should be a concise, URL-friendly slug (e.g., 'machine-learning')."
          }},
          "label": {{
            "type": "string",
            "description": "The human-readable title of the concept (e.g., 'Machine Learning')."
          }},
          "description": {{
            "type": "string",
            "description": "A brief, one-sentence explanation of the concept."
          }}
        }},
        "required": ["id", "label", "description"]
      }}
    }},
    "edges": {{
      "type": "array",
      "items": {{
        "type": "object",
        "properties": {{
          "source": {{
            "type": "string",
            "description": "The 'id' of the source node."
          }},
          "target": {{
            "type": "string",
            "description": "The 'id' of the target node."
          }},
          "label": {{
            "type": "string",
            "description": "Optional label for the relationship (e.g., 'is a type of')."
          }}
        }},
        "required": ["source", "target"]
      }}
    }}
  }},
  "required": ["nodes", "edges"]
}}

Subject to Analyze: {subject}

JSON Output:"""

def update_job_status(job_id: str, status: str, result_data: Dict = None, error_message: str = None):
    """
    Update job status using epistemic_driver_history table as a fallback.
    
    Args:
        job_id: Unique job identifier
        status: Job status ('processing', 'completed', 'failed')
        result_data: Generated mindmap data (for completed jobs)
        error_message: Error details (for failed jobs)
    """
    try:
        # Try to use epistemic_driver_history table as a fallback
        if status == 'completed' and result_data:
            # Store completed mindmap in epistemic_driver_history
            insert_data = {
                'title': f"Mindmap: {result_data.get('subject', 'Unknown Subject')}",
                'subject': result_data.get('subject', 'Unknown Subject'),
                'objectives': f"Generated mindmap for {result_data.get('subject', 'Unknown Subject')}",
                'study_map_data': {
                    'job_id': job_id,
                    'status': status,
                    'mindmap_data': result_data,
                    'generated_at': datetime.utcnow().isoformat()
                },
                'tags': ['aws-generated', 'mindmap', status],
                'notes': error_message if error_message else f"Generated via AWS Lambda - Job ID: {job_id}"
            }
            
            response = supabase_client.table('epistemic_driver_history').insert(insert_data).execute()
            
            logger.info(f"Stored completed mindmap job {job_id} in epistemic_driver_history", extra={
                'job_id': job_id,
                'status': status,
                'table': 'epistemic_driver_history'
            })
        else:
            # For non-completed status, just log the status
            logger.info(f"Job {job_id} status: {status}", extra={
                'job_id': job_id,
                'status': status,
                'has_result_data': bool(result_data),
                'has_error': bool(error_message),
                'error_message': error_message
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
    
    # Define JSON schema for strict response format enforcement
    mindmap_schema = {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "A unique identifier for the node, should be a concise, URL-friendly slug."
                        },
                        "label": {
                            "type": "string",
                            "description": "The human-readable title of the concept."
                        },
                        "description": {
                            "type": "string",
                            "description": "A brief, one-sentence explanation of the concept."
                        }
                    },
                    "required": ["id", "label", "description"]
                }
            },
            "edges": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "source": {
                            "type": "string",
                            "description": "The 'id' of the source node."
                        },
                        "target": {
                            "type": "string",
                            "description": "The 'id' of the target node."
                        },
                        "label": {
                            "type": "string",
                            "description": "Optional label for the relationship."
                        }
                    },
                    "required": ["source", "target"]
                }
            }
        },
        "required": ["nodes", "edges"]
    }
    
    # Generate mindmap structure using AI with schema enforcement
    prompt = generate_mindmap_prompt(subject)
    
    try:
        # Use Google Generative AI with JSON schema enforcement
        response = genai_client.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=mindmap_schema
            )
        )
        
        # Parse AI response - should be guaranteed valid JSON due to schema enforcement
        mindmap_data = json.loads(response.text)
        
        logger.info(f"Successfully generated schema-compliant mindmap data for job {job_id}", extra={
            'job_id': job_id,
            'node_count': len(mindmap_data.get('nodes', [])),
            'edge_count': len(mindmap_data.get('edges', []))
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON for job {job_id} (schema enforcement failed)", extra={
            'job_id': job_id,
            'ai_response': response.text[:500],  # Log first 500 chars
            'parse_error': str(e)
        })
        raise ValueError(f"Invalid JSON response from AI despite schema enforcement: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to generate content with schema enforcement for job {job_id}", extra={
            'job_id': job_id,
            'generation_error': str(e)
        })
        raise ValueError(f"AI generation failed: {str(e)}")
    
    # Validate required structure (additional safety check)
    if 'nodes' not in mindmap_data or 'edges' not in mindmap_data:
        raise ValueError("AI response missing required 'nodes' or 'edges' fields despite schema enforcement")
    
    # Create NetworkX graph
    G = nx.DiGraph()
    
    # Add nodes with enhanced attributes
    for node in mindmap_data['nodes']:
        # Ensure all required fields are present
        node_attrs = {
            'id': node['id'],
            'label': node['label'],
            'description': node['description'],
            # Add computed attributes for backward compatibility
            'level': 0,  # Will be computed based on graph structure
            'parent_id': None  # Will be computed based on edges
        }
        G.add_node(node['id'], **node_attrs)
    
    # Add edges with enhanced attributes
    for edge in mindmap_data['edges']:
        edge_attrs = {
            'source': edge['source'],
            'target': edge['target'],
            'label': edge.get('label', ''),
            'relationship': edge.get('label', 'connects to')  # Backward compatibility
        }
        G.add_edge(edge['source'], edge['target'], **edge_attrs)
    
    # Compute hierarchical levels and parent relationships
    try:
        # Find root nodes (nodes with no incoming edges)
        root_nodes = [node for node in G.nodes() if G.in_degree(node) == 0]
        
        if root_nodes:
            # Perform BFS to assign levels
            from collections import deque
            queue = deque([(root, 0) for root in root_nodes])
            visited = set()
            
            while queue:
                node_id, level = queue.popleft()
                if node_id in visited:
                    continue
                    
                visited.add(node_id)
                G.nodes[node_id]['level'] = level
                
                # Set parent_id for children
                for child in G.successors(node_id):
                    if child not in visited:
                        G.nodes[child]['parent_id'] = node_id
                        queue.append((child, level + 1))
                        
        logger.info(f"Computed hierarchical structure for job {job_id}", extra={
            'job_id': job_id,
            'root_nodes': len(root_nodes),
            'max_level': max([G.nodes[n].get('level', 0) for n in G.nodes()], default=0)
        })
        
    except Exception as e:
        logger.warning(f"Failed to compute hierarchical structure for job {job_id}: {str(e)}", extra={
            'job_id': job_id,
            'structure_error': str(e)
        })
    
    logger.info(f"Created graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges", extra={
        'job_id': job_id,
        'node_count': G.number_of_nodes(),
        'edge_count': G.number_of_edges()
    })
    
    # Calculate layout using available layout engines
    try:
        # Try to use pygraphviz for advanced dot layout if available
        try:
            import pygraphviz as pgv
            # Convert NetworkX graph to pygraphviz for layout calculation
            A = nx.nx_agraph.to_agraph(G)
            A.layout(prog='dot')
            
            # Extract positions from pygraphviz layout
            positioned_nodes = []
            for node_id in G.nodes():
                node_attrs = G.nodes[node_id].copy()  # Get all node attributes from graph
                
                try:
                    # Get node position from pygraphviz
                    agraph_node = A.get_node(node_id)
                    pos_str = agraph_node.attr['pos']
                    x, y = map(float, pos_str.split(','))
                    
                    # Scale positions for better visualization
                    node_attrs['x'] = float(x)
                    node_attrs['y'] = float(y)
                except (KeyError, ValueError, AttributeError):
                    # Fallback position if node not found or position parsing fails
                    logger.warning(f"Could not get position for node {node_id}, using fallback", extra={
                        'job_id': job_id,
                        'node_id': node_id
                    })
                    node_attrs['x'] = 0.0
                    node_attrs['y'] = 0.0
                
                positioned_nodes.append(node_attrs)
                
            logger.info(f"Successfully generated mindmap with pygraphviz dot layout for job {job_id}", extra={
                'job_id': job_id,
                'final_node_count': len(positioned_nodes)
            })
            
        except ImportError:
            # Fallback to NetworkX built-in layout algorithms
            logger.info(f"Pygraphviz not available, using NetworkX spring layout for job {job_id}", extra={
                'job_id': job_id
            })
            
            # Use NetworkX spring layout as fallback
            if G.number_of_nodes() > 0:
                pos = nx.spring_layout(G, k=3, iterations=50, seed=42)
            else:
                pos = {}
            
            # Extract positions from NetworkX layout
            positioned_nodes = []
            for node_id in G.nodes():
                node_attrs = G.nodes[node_id].copy()  # Get all node attributes from graph
                
                if node_id in pos:
                    # Scale positions for better visualization (NetworkX uses [-1, 1] range)
                    node_attrs['x'] = float(pos[node_id][0] * 200)  # Scale to reasonable pixel range
                    node_attrs['y'] = float(pos[node_id][1] * 200)
                else:
                    # Fallback position
                    node_attrs['x'] = 0.0
                    node_attrs['y'] = 0.0
                
                positioned_nodes.append(node_attrs)
                
            logger.info(f"Successfully generated mindmap with NetworkX spring layout for job {job_id}", extra={
                'job_id': job_id,
                'final_node_count': len(positioned_nodes)
            })
        
        # Return final mindmap data with positions
        final_data = {
            'subject': subject,
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
    AWS Lambda handler for processing mindmap generation jobs.
    Supports both API Gateway (HTTP) and SQS events.
    
    Args:
        event: Lambda event (API Gateway or SQS)
        context: Lambda context object
        
    Returns:
        Processing results or HTTP response
    """
    logger.info("Handler invoked", extra={
        'event_source': event.get('Records', [{}])[0].get('eventSource') if 'Records' in event else 'apigateway',
        'request_id': context.aws_request_id
    })
    
    # Determine event source
    if 'Records' in event and event['Records']:
        # SQS event
        return handle_sqs_event(event, context)
    else:
        # API Gateway event
        return handle_api_event(event, context)

def handle_api_event(event, context):
    """
    Handle API Gateway events for direct mindmap generation requests.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        job_id = body.get('jobId')
        subject = body.get('subject')
        
        # Generate jobId if not provided
        if not job_id:
            job_id = f"api-{int(datetime.utcnow().timestamp() * 1000)}"
        
        if not subject:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Missing required field: subject',
                    'success': False
                })
            }
        
        # Queue the job for processing
        queue_url = os.environ.get('SQS_QUEUE_URL')
        if queue_url:
            sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps({
                    'jobId': job_id,
                    'subject': subject,
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
            
            return {
                'statusCode': 202,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'jobId': job_id,
                    'status': 'queued',
                    'message': 'Mindmap generation job queued successfully',
                    'success': True
                })
            }
        else:
            # Process synchronously if no queue configured
            mindmap_data = process_mindmap_generation(job_id, subject)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'jobId': job_id,
                    'status': 'completed',
                    'data': mindmap_data,
                    'success': True
                })
            }
            
    except Exception as e:
        logger.exception("Error processing API request")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'error': str(e),
                'success': False
            })
        }

def handle_sqs_event(event, context):
    """
    Handle SQS events for asynchronous mindmap generation.
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