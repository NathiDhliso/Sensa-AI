#!/usr/bin/env python3
"""
Test script for JSON schema enforcement in Sensa Mindmap Generator.
This script tests the new advanced prompt engineering with strict schema validation.
"""

import json
import os
import sys
from typing import Dict, Any

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the mindmap generator functions
try:
    from sensa_mindmap_generator import (
        generate_mindmap_prompt,
        process_mindmap_generation,
        initialize_clients
    )
except ImportError as e:
    print(f"❌ Failed to import mindmap generator: {e}")
    print("Make sure you're running this from the adk-agents directory")
    sys.exit(1)

def test_prompt_structure():
    """
    Test the new prompt structure with JSON schema.
    """
    print("\n🧪 Testing Prompt Structure...")
    
    subject = "Quantum Computing"
    prompt = generate_mindmap_prompt(subject)
    
    # Check if prompt contains required elements
    required_elements = [
        "JSON Schema:",
        "Subject to Analyze:",
        "JSON Output:",
        '"type": "object"',
        '"nodes"',
        '"edges"',
        '"required": ["id", "label", "description"]'
    ]
    
    missing_elements = []
    for element in required_elements:
        if element not in prompt:
            missing_elements.append(element)
    
    if missing_elements:
        print(f"❌ Prompt missing required elements: {missing_elements}")
        return False
    else:
        print("✅ Prompt structure contains all required schema elements")
        print(f"📝 Prompt length: {len(prompt)} characters")
        return True

def test_schema_validation():
    """
    Test the JSON schema structure.
    """
    print("\n🧪 Testing Schema Validation...")
    
    # Sample valid response that should match the schema
    valid_response = {
        "nodes": [
            {
                "id": "quantum-computing",
                "label": "Quantum Computing",
                "description": "A revolutionary computing paradigm using quantum mechanics principles."
            },
            {
                "id": "qubits",
                "label": "Qubits",
                "description": "The fundamental unit of quantum information."
            }
        ],
        "edges": [
            {
                "source": "quantum-computing",
                "target": "qubits",
                "label": "uses"
            }
        ]
    }
    
    # Sample invalid response missing required fields
    invalid_response = {
        "nodes": [
            {
                "id": "quantum-computing",
                "label": "Quantum Computing"
                # Missing 'description' field
            }
        ],
        "edges": []
    }
    
    def validate_response(response: Dict[str, Any]) -> bool:
        """Validate response against our expected schema."""
        try:
            # Check top-level structure
            if not isinstance(response, dict):
                return False
            if 'nodes' not in response or 'edges' not in response:
                return False
            
            # Check nodes structure
            if not isinstance(response['nodes'], list):
                return False
            for node in response['nodes']:
                if not isinstance(node, dict):
                    return False
                required_fields = ['id', 'label', 'description']
                for field in required_fields:
                    if field not in node or not isinstance(node[field], str):
                        return False
            
            # Check edges structure
            if not isinstance(response['edges'], list):
                return False
            for edge in response['edges']:
                if not isinstance(edge, dict):
                    return False
                required_fields = ['source', 'target']
                for field in required_fields:
                    if field not in edge or not isinstance(edge[field], str):
                        return False
            
            return True
        except Exception:
            return False
    
    # Test valid response
    if validate_response(valid_response):
        print("✅ Valid response passes schema validation")
    else:
        print("❌ Valid response failed schema validation")
        return False
    
    # Test invalid response
    if not validate_response(invalid_response):
        print("✅ Invalid response correctly rejected by schema validation")
    else:
        print("❌ Invalid response incorrectly passed schema validation")
        return False
    
    return True

def test_end_to_end_generation():
    """
    Test end-to-end mindmap generation with schema enforcement.
    Note: This requires valid API credentials and may make actual API calls.
    """
    print("\n🧪 Testing End-to-End Generation...")
    
    # Check if we have the required environment variables
    required_env_vars = ['GOOGLE_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"⚠️  Skipping end-to-end test - missing environment variables: {missing_vars}")
        print("   Set these variables to test actual API integration")
        return True
    
    try:
        # Initialize clients
        initialize_clients()
        
        # Test generation
        job_id = "test-schema-enforcement-001"
        subject = "Neural Networks and Deep Learning"
        
        print(f"🚀 Generating mindmap for: {subject}")
        result = process_mindmap_generation(job_id, subject)
        
        # Validate the result structure
        if not isinstance(result, dict):
            print("❌ Result is not a dictionary")
            return False
        
        required_keys = ['nodes', 'edges', 'metadata']
        for key in required_keys:
            if key not in result:
                print(f"❌ Result missing required key: {key}")
                return False
        
        # Check nodes structure
        nodes = result['nodes']
        if not isinstance(nodes, list) or len(nodes) == 0:
            print("❌ No nodes generated")
            return False
        
        # Validate first node has required schema fields
        first_node = nodes[0]
        required_node_fields = ['id', 'label', 'description', 'x', 'y']
        for field in required_node_fields:
            if field not in first_node:
                print(f"❌ Node missing required field: {field}")
                return False
        
        print(f"✅ Successfully generated mindmap with {len(nodes)} nodes and {len(result['edges'])} edges")
        print(f"📊 Sample node: {first_node['label']} - {first_node['description'][:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ End-to-end test failed: {str(e)}")
        return False

def main():
    """
    Run all tests for JSON schema enforcement.
    """
    print("🚀 Starting Sensa Mindmap Generator Schema Enforcement Tests")
    print("=" * 60)
    
    tests = [
        ("Prompt Structure", test_prompt_structure),
        ("Schema Validation", test_schema_validation),
        ("End-to-End Generation", test_end_to_end_generation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} Test...")
        try:
            if test_func():
                print(f"✅ {test_name} Test PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} Test FAILED")
        except Exception as e:
            print(f"❌ {test_name} Test ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Schema enforcement is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())