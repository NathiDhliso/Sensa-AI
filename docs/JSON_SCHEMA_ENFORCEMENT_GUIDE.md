# JSON Schema Enforcement for Sensa AI Mindmap Generation

## Overview

This document describes the implementation of advanced prompt engineering with JSON schema enforcement for the Sensa AI mindmap generation system. This enhancement ensures consistent, predictable, and machine-readable output from large language models (LLMs).

## Problem Statement

Vague prompts like "generate a mindmap" produce inconsistent and unreliable results from LLMs. To build a robust automated system, the model's output must be predictable and machine-readable. This requires advanced prompt engineering techniques that constrain the model to a specific output format.

## Solution: JSON Schema Enforcement

The most effective strategy is to provide a strict JSON schema and instruct the model to adhere to it. The Google Generative AI SDK supports this directly through the `generation_config` parameter with `response_schema`.

## Implementation Details

### 1. Backend Implementation (Python)

#### Enhanced Prompt Structure

**File:** `adk-agents/sensa_mindmap_generator.py`

The new prompt follows this structure:

```python
def generate_mindmap_prompt(subject: str) -> str:
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
```

#### Schema-Enforced AI Generation

The AI generation now uses Google Generative AI's schema enforcement:

```python
# Define JSON schema for strict response format enforcement
mindmap_schema = {
    "type": "object",
    "properties": {
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "label": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["id", "label", "description"]
            }
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "label": {"type": "string"}
                },
                "required": ["source", "target"]
            }
        }
    },
    "required": ["nodes", "edges"]
}

# Use Google Generative AI with JSON schema enforcement
response = genai_client.generate_content(
    prompt,
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=mindmap_schema
    )
)
```

#### Enhanced Node Processing

The system now computes hierarchical levels and parent relationships automatically:

```python
# Compute hierarchical levels and parent relationships
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
```

### 2. Frontend Integration (TypeScript)

**File:** `src/services/sensaMindmapIntegration.ts`

#### Dual Format Support

The frontend now supports both legacy mermaid_code format and new JSON schema-enforced structure:

```typescript
static transformToMindmapData(
  result: ADKAgentResponse, 
  metadata: Record<string, any> = {}
): MermaidStudyMap {
  const data = result.data || result;
  const studyMap = data.study_map || data.mindmap || data;
  
  // Check if we have the new JSON schema-enforced structure
  if (studyMap.nodes && studyMap.edges && Array.isArray(studyMap.nodes) && Array.isArray(studyMap.edges)) {
    // Convert nodes/edges structure to Mermaid mindmap format
    const mermaidCode = this.convertNodesToMermaidMindmap(studyMap.nodes, studyMap.edges, metadata);
    const nodeData = this.convertNodesToNodeData(studyMap.nodes);
    
    return {
      mermaid_code: mermaidCode,
      node_data: nodeData,
      legend_html: studyMap.legend_html || this.generateLegendFromNodes(studyMap.nodes)
    };
  }
  
  // Fallback to legacy format
  return {
    mermaid_code: studyMap.mermaid_code || `mindmap\n  root((${metadata.sourceType || 'Error'}))\n    Invalid data received`,
    node_data: studyMap.node_data || {},
    legend_html: studyMap.legend_html || '<p>Generated study map</p>'
  };
}
```

#### Nodes to Mermaid Conversion

Automatic conversion from nodes/edges structure to Mermaid mindmap syntax:

```typescript
private static convertNodesToMermaidMindmap(
  nodes: Array<{id: string, label: string, description: string, level?: number, parent_id?: string}>,
  edges: Array<{source: string, target: string, label?: string}>,
  metadata: Record<string, any> = {}
): string {
  try {
    // Find root nodes (nodes with no incoming edges or level 0)
    const targetIds = new Set(edges.map(edge => edge.target));
    const rootNodes = nodes.filter(node => 
      !targetIds.has(node.id) || node.level === 0 || node.parent_id === null
    );
    
    let mermaidCode = 'mindmap\n';
    const processedNodes = new Set<string>();
    
    for (const rootNode of rootNodes) {
      mermaidCode += `  root((${rootNode.label}))\n`;
      mermaidCode = this.addChildrenToMermaid(rootNode.id, nodes, edges, mermaidCode, 2, processedNodes);
    }
    
    return mermaidCode;
  } catch (error) {
    console.error('Error converting nodes to Mermaid mindmap:', error);
    return `mindmap\n  root((${metadata.subject || 'Mindmap'}))\n    Error processing data`;
  }
}
```

## Testing

### Automated Test Suite

**File:** `adk-agents/test_prompt_schema.py`

Comprehensive test suite covering:

1. **Prompt Structure Test**: Validates that prompts contain all required schema elements
2. **Schema Validation Test**: Tests response validation against the JSON schema
3. **JSON Schema Structure Test**: Ensures the schema itself is well-formed

### Test Results

```
🚀 Starting Sensa Mindmap Generator Schema Enforcement Tests
============================================================

📋 Running Prompt Structure Test...
✅ Prompt structure contains all required schema elements
📝 Prompt length: 1803 characters
✅ Prompt Structure Test PASSED

📋 Running Schema Validation Test...
✅ Valid response passes schema validation
📊 Valid response has 3 nodes and 2 edges
✅ Invalid response correctly rejected by schema validation
✅ Schema Validation Test PASSED

📋 Running JSON Schema Structure Test...
✅ JSON schema structure is valid
📋 Schema defines 2 top-level properties
✅ JSON Schema Structure Test PASSED

============================================================
📊 Test Results: 3/3 tests passed
🎉 All tests passed! Schema enforcement is working correctly.
```

## Benefits

### 1. Consistency
- **Predictable Output**: Every AI response follows the exact same structure
- **Reliable Parsing**: No more JSON parsing errors or malformed responses
- **Standardized Format**: All mindmaps use consistent node and edge definitions

### 2. Reliability
- **Schema Validation**: Google Generative AI enforces the schema at generation time
- **Error Prevention**: Malformed responses are prevented rather than handled after the fact
- **Robust Processing**: Frontend can reliably process any response from the backend

### 3. Maintainability
- **Clear Structure**: Well-defined interfaces between AI and application
- **Easy Debugging**: Consistent format makes troubleshooting straightforward
- **Future-Proof**: Schema can be extended without breaking existing functionality

### 4. Performance
- **Faster Processing**: No need for complex parsing or error recovery
- **Reduced Latency**: Fewer failed generations requiring retries
- **Efficient Validation**: Schema validation is built into the AI generation process

## Usage Examples

### Backend Usage

```python
# Generate mindmap with schema enforcement
job_id = "example-001"
subject = "Machine Learning Fundamentals"

result = process_mindmap_generation(job_id, subject)

# Result is guaranteed to have this structure:
# {
#   "nodes": [
#     {
#       "id": "machine-learning",
#       "label": "Machine Learning",
#       "description": "A subset of AI that enables computers to learn without explicit programming.",
#       "x": 100.0,
#       "y": 50.0,
#       "level": 0,
#       "parent_id": null
#     }
#   ],
#   "edges": [
#     {
#       "source": "machine-learning",
#       "target": "supervised-learning",
#       "label": "includes"
#     }
#   ],
#   "metadata": {
#     "subject": "Machine Learning Fundamentals",
#     "generated_at": "2024-01-15T10:30:00Z",
#     "node_count": 15,
#     "edge_count": 14
#   }
# }
```

### Frontend Usage

```typescript
// Generate mindmap from frontend
const mindmapData = await SensaMindmapIntegration.generateMindmap({
  subject: "Quantum Computing",
  content: "Introduction to quantum computing concepts",
  userId: "user123",
  options: {
    includeMemories: true,
    format: "detailed"
  }
});

// Result is automatically converted to MermaidStudyMap format:
// {
//   mermaid_code: "mindmap\n  root((Quantum Computing))\n    Qubits\n    Superposition\n    Entanglement",
//   node_data: {
//     "quantum-computing": {
//       id: "quantum-computing",
//       label: "Quantum Computing",
//       description: "Revolutionary computing paradigm...",
//       x: 0,
//       y: 0
//     }
//   },
//   legend_html: "<div class='mindmap-legend'>...</div>"
// }
```

## Migration Guide

### For Existing Implementations

1. **Backend**: The new implementation is backward compatible. Existing API calls will continue to work.

2. **Frontend**: The `transformToMindmapData` method automatically detects the response format and handles both legacy and new structures.

3. **Testing**: Use the provided test suite to validate your implementation:
   ```bash
   cd adk-agents
   python test_prompt_schema.py
   ```

### Configuration

No additional configuration is required. The schema enforcement is enabled by default for all new mindmap generations.

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - **Cause**: Google Generative AI API key issues or model limitations
   - **Solution**: Verify API credentials and model access

2. **Conversion Errors**
   - **Cause**: Unexpected node/edge structures
   - **Solution**: Check the error logs and validate input data

3. **Legacy Format Issues**
   - **Cause**: Old responses not following new schema
   - **Solution**: The system automatically falls back to legacy processing

4. **Layout Engine Issues**
   - **Pygraphviz Installation Fails**: This is common on Windows. The system automatically falls back to NetworkX spring layout
   - **Missing Graphviz**: Install Graphviz system package before attempting pygraphviz installation
   - **Layout Quality**: NetworkX spring layout provides good results for most use cases, though pygraphviz dot layout may be preferred for hierarchical structures

### Layout Engine Fallback

The system includes automatic fallback behavior:
- **Primary**: Pygraphviz dot layout (if available) - optimal for hierarchical mindmaps
- **Fallback**: NetworkX spring layout (always available) - good general-purpose layout
- **Metadata**: The `layout_engine` field indicates which engine was used

### Testing Layout Functionality

```bash
# Test schema enforcement
python test_prompt_schema.py

# Test NetworkX fallback layout
python test_networkx_layout.py
```

### Debug Mode

Enable detailed logging by setting the log level in the backend:

```python
logger.setLevel(logging.DEBUG)
```

## Installation Requirements

### Backend Dependencies
```bash
pip install networkx google-generativeai
# pygraphviz is optional for advanced dot layouts
# pip install pygraphviz  # Requires Graphviz system installation
```

### Frontend Dependencies
```bash
npm install @types/node
```

### Optional: Advanced Layout Engine
For enhanced graph layouts, you can optionally install pygraphviz:

**Windows:**
```bash
# Install Graphviz first
winget install graphviz
# Then install pygraphviz
pip install pygraphviz
```

**Note:** The system automatically falls back to NetworkX spring layout if pygraphviz is not available.

## Future Enhancements

1. **Extended Schema**: Add support for node categories, colors, and custom attributes
2. **Validation Layers**: Implement additional validation beyond the basic schema
3. **Performance Optimization**: Cache schema validation results for improved performance
4. **Multi-Language Support**: Extend schema to support multiple languages

## Conclusion

The JSON schema enforcement implementation provides a robust foundation for reliable mindmap generation. By constraining the AI model to a specific output format, we ensure consistent, predictable, and machine-readable results that can be reliably processed by the frontend application.

This approach represents a significant improvement in the reliability and maintainability of the Sensa AI mindmap generation system, providing a solid foundation for future enhancements and scaling.